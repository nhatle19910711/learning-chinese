# Research Report: Cloudflare Workers Static Assets + Gemini API Proxy

**Date:** 2026-06-03  
**Topic:** Integrating a Worker fetch handler for /api/* Gemini proxy while serving SPA from static assets  
**Status:** Complete

---

## TOPIC 1: Cloudflare Workers Static Assets + Worker Fetch Handler

### Current Config Problem
Your project currently has NO `main` worker script—only static assets. To add API routing while preserving SPA serving, you need to introduce a Worker entry point that intercepts `/api/*` but delegates everything else to assets.

### Exact wrangler.jsonc Configuration

**Minimal config to add:**

```jsonc
{
  "name": "learning-chinese",
  "compatibility_date": "2025-01-01",
  "main": "src/index.ts",                    // ADD: entry point for Worker handler
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",                      // ADD: binding name (must match env.ASSETS.fetch() in code)
    "html_handling": "auto-trailing-slash",   // optional, helps SPA routing
  },
  "env": {
    "production": {
      "routes": [
        { "pattern": "example.com/*", "zone_name": "example.com" }
      ]
    }
  }
}
```

### Execution Order: `run_worker_first` Behavior

**Default (`run_worker_first` absent or `false`):**
- Cloudflare tries asset-first: if URL matches a file in `./dist`, serve it immediately.
- Only if NO asset matches → Worker code runs.
- **For /api/* routes:** Worker runs because no assets exist at those paths.

**For your /api/* + SPA combo:**
- You do NOT need `run_worker_first: true`. Default behavior is perfect.
- Requests to `/api/chat` → no asset match → Worker runs.
- Requests to `/` or `/index.html` → asset match → served directly.
- Requests to missing assets (like `/invalid-page`) → no asset match → Worker runs → can delegate to ASSETS.fetch() to trigger SPA fallback.

**Optional: Selective `run_worker_first` (if you need middleware for ALL requests):**

```jsonc
"run_worker_first": ["/api/*", "/auth/*"]  // Array of glob patterns
```

This runs Worker-first only for matching patterns; other requests still asset-first.

### Minimal Worker Code Pattern

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Route /api/* to Gemini handler
    if (url.pathname.startsWith("/api/")) {
      return handleGeminiAPI(request, env);
    }
    
    // Fallback: delegate to static assets (SPA shell or 404)
    return env.ASSETS.fetch(request);
  }
};
```

### Secrets: Setup & Access

**Deployment (production):**
```bash
wrangler secret put GEMINI_API_KEY
# Prompts: paste key → stored encrypted, invisible in dashboard
```

**Local Development (.dev.vars file):**
```
# .dev.vars (add to .gitignore)
GEMINI_API_KEY=YOUR_FREE_API_KEY_HERE
```

**Access in Worker code:**
```typescript
const apiKey = env.GEMINI_API_KEY;
// No import needed; env binding is automatic in fetch handler
```

### SSE Streaming: TransformStream + Response

Cloudflare Workers **fully supports** SSE streaming (text/event-stream). Pattern:

```typescript
const { readable, writable } = new TransformStream();

// Return stream immediately
const response = new Response(readable, {
  headers: { "Content-Type": "text/event-stream" },
});

// Write SSE chunks asynchronously (don't await)
ctx.waitUntil((async () => {
  const writer = writable.getWriter();
  try {
    // Fetch from Gemini, read chunks, write SSE format
    for await (const chunk of geminiStream) {
      await writer.write(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
  } finally {
    writer.close();
  }
})());

return response;
```

**Key:** Use `ctx.waitUntil()` to prevent Worker termination before stream completes.

---

## TOPIC 2: Google Gemini Free API (2026)

### Current Free-Tier Models & Limits

**As of June 2026 (latest):**

| Model | Input/Output Cost | Free Tier RPM | Free Tier RPD | Free Tier TPM | Notes |
|-------|------------------|--------------|--------------|--------------|-------|
| **Gemini 3.5 Flash** (latest, May 2026) | $0.075/$0.30 per 1M tokens | ~10–15 | 1,500 | 1,000,000 | **Recommended** for free tier; most capable Flash variant |
| Gemini 3.1 Flash-Lite | free | higher quota | 1,500 | 1,000,000 | Lighter alternative |
| Gemini 2.5 Flash | $0.30/$2.50 per 1M tokens | 10 | 1,500 | 250,000 | Older; slower limits than 3.5 |
| Gemini 2.5 Flash-Lite | free | higher quota | 1,500 | 1,000,000 | Deprecated June 1, 2026 |

**Note on limits:** Free tier quotas vary; check AI Studio dashboard at [ai.google.dev](https://ai.google.dev) for your exact live limits. Rates reset daily/minutely.

### REST Streaming Endpoint

**URL:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse
```

**Critical:** The `?alt=sse` parameter is mandatory for SSE streaming. Without it, the endpoint returns a JSON array instead of event-stream chunks.

### Headers & Authentication

```
x-goog-api-key: YOUR_API_KEY
Content-Type: application/json
```

**No special auth needed** — API key in header (not `Authorization` bearer). Single key per project.

### Request Body Shape (Multi-turn Chat Example)

```json
{
  "system_instruction": {
    "role": "user",
    "parts": [
      {
        "text": "You are a helpful Chinese language tutor. Explain grammar using English."
      }
    ]
  },
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Explain the 了 (le) particle."
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "text": "The 了 particle indicates..."
        }
      ]
    },
    {
      "role": "user",
      "parts": [
        {
          "text": "Give an example sentence."
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 40,
    "maxOutputTokens": 500
  }
}
```

**Key points:**
- `system_instruction.role`: always `"user"` (undocumented quirk)
- `system_instruction.parts`: array of `{text: string}` objects
- `contents[]`: alternating `user` / `model` roles (history format)
- `generationConfig`: optional; controls sampling behavior

### SSE Response Format

Each chunk arrives as a Server-Sent Event:

```
data: {"candidates":[{"index":0,"content":{"role":"model","parts":[{"text":"The"}]}}],"usageMetadata":{"promptTokenCount":50,"cachedContentInputTokenCount":0}}

data: {"candidates":[{"index":0,"content":{"role":"model","parts":[{"text":" "}]}}],"usageMetadata":{...}}

data: {"candidates":[{"index":0,"content":{"role":"model","parts":[{"text":"particle"}]}}],"usageMetadata":{...}}
```

**To extract text incrementally:**

```typescript
const line = event.data; // "data: {JSON}"
const json = JSON.parse(line.substring(6)); // strip "data: "
const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
```

### Multi-turn Conversation Pattern

```typescript
const history: Array<{role: "user" | "model", parts: Array<{text: string}>}> = [];

// User sends message
history.push({ role: "user", parts: [{text: userMessage}] });

// Request to Gemini with full history
const body = {
  system_instruction: {...},
  contents: history,
  generationConfig: {...}
};

// Stream response, collect model text
const modelText = "";
// ... stream and append to modelText ...

// Add model response to history
history.push({ role: "model", parts: [{text: modelText}] });

// Next user message appends to same history array
```

### systemInstruction Support

**Fully supported** as of Gemini 3+ APIs. Shape:

```json
{
  "role": "user",
  "parts": [
    {
      "text": "Your system instruction text here..."
    }
  ]
}
```

Used to set behavioral constraints (e.g., "Always respond in JSON", "Act as a tutoring bot"). Not counted in token limits on some tiers (verify for free tier).

### CORS / Cross-Origin Concerns

**None.** Cloudflare Worker is a **server-side proxy** (server-to-server fetch). Browser CORS rules do NOT apply. Worker calls Gemini API directly; client sees Worker origin only.

---

## Summary: Integration Checklist

1. ✅ Add `main: "src/index.ts"` + `assets.binding: "ASSETS"` to wrangler.jsonc
2. ✅ Create Worker entry point that routes `/api/*` → Gemini handler, else → `env.ASSETS.fetch()`
3. ✅ Store `GEMINI_API_KEY` via `wrangler secret put` (prod) or `.dev.vars` (dev)
4. ✅ Use `gemini-3.5-flash` (free, latest, recommended)
5. ✅ POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse`
6. ✅ Header: `x-goog-api-key: <key>`
7. ✅ Body: `{system_instruction, contents[], generationConfig}`
8. ✅ Response: SSE stream → parse `candidates[0].content.parts[0].text` per chunk
9. ✅ Use `TransformStream` + `ctx.waitUntil()` for SSE streaming in Worker

---

## Unresolved Questions

1. **Free tier rate limits precision:** Official docs defer to AI Studio dashboard. Exact RPM/RPD for free tier may have changed since May 2026—verify in AI Studio before deployment.
2. **systemInstruction token counting:** Unclear if system instruction tokens count against free-tier TPM limit. Test empirically with a request.
3. **Caching headers:** Whether Gemini API responses include cache-control hints that could reduce token usage on repeat questions (investigate response headers).
4. **SSE chunk timing:** Exact latency between Gemini generation and SSE chunk delivery (for UX timing).

---

**Sources:**
- [Cloudflare Workers Static Assets Binding](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare Workers Static Assets Routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Workers ReadableStream](https://developers.cloudflare.com/workers/runtime-apis/streams/readablestream/)
- [Google Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google Gemini API Text Generation](https://ai.google.dev/gemini-api/docs/text-generation)
- [Google Gemini API Reference](https://ai.google.dev/api)
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
