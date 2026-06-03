# Phase 01 — Worker Proxy Foundation & Passcode Gate

**Priority:** P0 (nền tảng — mọi phase khác phụ thuộc)
**Status:** planned

## Context Links
- Research: [../reports/researcher-260603-0938-gemini-cf-worker-proxy.md](../reports/researcher-260603-0938-gemini-cf-worker-proxy.md)
- Config hiện tại: [../../wrangler.jsonc](../../wrangler.jsonc), [../../package.json](../../package.json)

## Overview
Dựng "đường ống" 2 đầu: Worker proxy `/api/*` (giấu Gemini key, gate passcode, stream SSE) + client helper (`ai-client`, passcode store, gate UI). Chưa có tính năng AI cụ thể nào — chỉ hạ tầng + 1 endpoint health/echo để kiểm thử. Đây là phase quan trọng nhất.

## Key Insights
- Workers Static Assets: asset-first mặc định → `/api/*` (không có file) tự rơi vào Worker. **Không cần** `run_worker_first`.
- `env.ASSETS.fetch(request)` để giữ SPA fallback cho mọi route không phải `/api/*`.
- SSE từ Worker: `TransformStream` + `ctx.waitUntil()` giữ Worker sống khi đang ghi stream.
- Gemini header auth = `x-goog-api-key` (không phải Bearer); server-to-server nên **không** dính CORS.
- Passcode là tuyến phòng thủ chính chống đốt quota free tier.

## Requirements
**Functional**
- Worker route `/api/*` → handler; còn lại → `ASSETS.fetch`.
- Mọi `/api/*` (trừ health) yêu cầu header `x-app-passcode` khớp `env.APP_PASSCODE`; sai/thiếu → 401 JSON.
- `gemini-client` gọi `streamGenerateContent?alt=sse`, parse SSE → async iterable text chunks; có biến thể non-stream (`generateContent`) trả JSON cho phase chấm câu/bài tập.
- Client: `ai-client` đính passcode header, có `postStream()` (đọc ReadableStream SSE) và `postJson()`.
- `passcode-gate`: modal nhập mật khẩu lần đầu, lưu `localStorage` (`lc-ai-passcode`); nút đổi/xóa.

**Non-functional**
- API key & passcode KHÔNG xuống client. `.dev.vars` + `.gitignore`.
- Lỗi 401/429/network trả JSON `{error, code}` nhất quán; client map sang message tiếng Việt.
- Rate-limit per-isolate nhẹ (token bucket theo IP, best-effort) — log/deny mềm, không phụ thuộc.

## Architecture
```
worker/
├── index.ts                 # fetch(): route /api/* → handlers, else ASSETS.fetch
├── types.ts                 # Env interface (ASSETS, GEMINI_API_KEY, APP_PASSCODE, GEMINI_MODEL?)
├── lib/
│   ├── auth.ts              # checkPasscode(request, env) → bool
│   ├── rate-limit.ts        # per-isolate token bucket (best-effort)
│   ├── sse.ts               # sseResponse(): TransformStream + writer helpers
│   ├── gemini-client.ts     # streamGemini() async generator + generateGeminiJson()
│   └── http.ts              # jsonResponse(), errorResponse(code, msg)
└── config.ts                # GEMINI_MODEL default, API base URL, limits

src/lib/
├── ai-contracts.ts          # types dùng chung (ChatTurn, GradeResult, Exercise…) — worker import lại
├── ai-passcode.ts           # get/set/clear passcode (localStorage)
└── ai-client.ts             # postStream(path, body, onToken), postJson(path, body)

src/components/ai/
├── passcode-gate.tsx        # modal nhập passcode
├── passcode-gate.css
└── ai-error-banner.tsx      # hiển thị lỗi AI thân thiện (VI)
```

## Related Code Files
**Create (worker):** `worker/index.ts`, `worker/types.ts`, `worker/config.ts`, `worker/lib/{auth,rate-limit,sse,gemini-client,http}.ts`
**Create (frontend):** `src/lib/{ai-contracts,ai-passcode,ai-client}.ts`, `src/components/ai/{passcode-gate.tsx,passcode-gate.css,ai-error-banner.tsx}`
**Create (config):** `.dev.vars` (gitignored), `tsconfig.worker.json`, `worker-configuration.d.ts` (sinh bởi `wrangler types`)
**Modify:** `wrangler.jsonc` (thêm `main`, `assets.binding`), `package.json` (thêm `@cloudflare/workers-types`, script `cf-typegen`, `dev:worker`), `.gitignore` (`.dev.vars`)

## Implementation Steps
1. `npm i -D @cloudflare/workers-types`. Thêm scripts: `"cf-typegen": "wrangler types"`, `"dev:worker": "wrangler dev"`.
2. Sửa `wrangler.jsonc`:
   ```jsonc
   {
     "name": "learning-chinese",
     "compatibility_date": "2025-01-01",
     "main": "worker/index.ts",
     "assets": { "directory": "./dist", "binding": "ASSETS", "not_found_handling": "single-page-application" }
   }
   ```
3. `worker/types.ts`: `interface Env { ASSETS: Fetcher; GEMINI_API_KEY: string; APP_PASSCODE: string; GEMINI_MODEL?: string }`.
4. `worker/config.ts`: `GEMINI_MODEL = env.GEMINI_MODEL ?? "gemini-2.5-flash"`, `GEMINI_BASE`, `MAX_OUTPUT_TOKENS`, `HISTORY_LIMIT`, rate-limit consts.
5. `worker/lib/http.ts`: `jsonResponse(data, status)`, `errorResponse(status, code, msg)` (CORS-free, same-origin).
6. `worker/lib/auth.ts`: so `request.headers.get('x-app-passcode')` với `env.APP_PASSCODE` (so sánh constant-time đơn giản).
7. `worker/lib/sse.ts`: `createSseStream()` → `{ response, write(textEvent), close() }` dùng `TransformStream` + encoder; helper format `data: {json}\n\n`.
8. `worker/lib/gemini-client.ts`:
   - `async function* streamGemini(env, {system, contents, generationConfig})` → fetch `…:streamGenerateContent?alt=sse`, đọc body reader, tách dòng `data: `, `yield` text increment. Xử lý 429/4xx → throw có `code`.
   - `async function generateGeminiJson(env, {...})` → `…:generateContent`, trả object (cho phase 03/04).
9. `worker/lib/rate-limit.ts`: Map per-isolate `ip→{tokens,ts}`, `allow(ip)` best-effort.
10. `worker/index.ts`: parse URL; nếu `/api/health` → `{ok:true}` (no auth); nếu `/api/*` → check passcode (401) + rate-limit → dispatch tới handler (phase sau gắn); else `env.ASSETS.fetch(request)`. Phase 01 chỉ cần 1 echo route `/api/echo` để test SSE + JSON.
11. `.dev.vars`: `GEMINI_API_KEY=...`, `APP_PASSCODE=...`. Thêm `.dev.vars` vào `.gitignore`.
12. Frontend `src/lib/ai-passcode.ts`: `getPasscode()/setPasscode()/clearPasscode()` (key `lc-ai-passcode`).
13. `src/lib/ai-contracts.ts`: định nghĩa `ChatTurn{role,text}`, `AiErrorCode`, placeholder cho `GradeResult`/`Exercise` (điền ở phase sau).
14. `src/lib/ai-client.ts`:
    - `postJson(path, body)` → fetch + header passcode, throw `AiError{code}` theo status.
    - `postStream(path, body, onToken, signal)` → fetch SSE, `response.body.getReader()` + `TextDecoder`, tách `data:` lines, gọi `onToken(text)`; trả promise hoàn tất.
15. `passcode-gate.tsx`: nếu chưa có passcode → modal nhập (lưu localStorage). `ai-error-banner.tsx`: nhận `code` → message VI ("Hết lượt AI hôm nay", "Sai mật khẩu", "Mất kết nối").
16. `npm run cf-typegen` để sinh `worker-configuration.d.ts`. `wrangler dev` test `/api/health`, `/api/echo` (stream + json), kiểm passcode 401.

## Todo List
- [ ] Cài `@cloudflare/workers-types`, thêm scripts
- [ ] Sửa `wrangler.jsonc` (`main` + `assets.binding`)
- [ ] `worker/types.ts`, `worker/config.ts`
- [ ] `worker/lib/http.ts`, `auth.ts`, `sse.ts`, `rate-limit.ts`
- [ ] `worker/lib/gemini-client.ts` (stream + json)
- [ ] `worker/index.ts` routing + `/api/health` + `/api/echo`
- [ ] `.dev.vars` + `.gitignore`
- [ ] `src/lib/ai-passcode.ts`, `ai-contracts.ts`, `ai-client.ts`
- [ ] `src/components/ai/passcode-gate.tsx` (+css), `ai-error-banner.tsx`
- [ ] `wrangler types` → `worker-configuration.d.ts`
- [ ] `wrangler dev`: test health/echo/passcode 401/SSE
- [ ] `npm run build` + `tsc -b` (app) + tsc worker pass

## Success Criteria
- `wrangler dev`: `GET /api/health` 200; SPA `/`, `/lesson/x` vẫn chạy; route lạ → SPA fallback.
- `/api/echo` sai/thiếu passcode → 401; đúng passcode → echo (cả JSON & SSE stream).
- Không có key/passcode trong bundle client (grep `dist/`), `.dev.vars` không bị track git.

## Risk Assessment
- **`main` phá static serving** → nhớ `ASSETS.fetch` fallback + `not_found_handling`. Test SPA route sau khi thêm `main`.
- **SSE bị buffer** → đảm bảo `?alt=sse`, header `text/event-stream`, dùng `ctx.waitUntil`.
- **tsconfig app nuốt worker types** → tách `tsconfig.worker.json`, exclude `worker/` khỏi app tsconfig.

## Security Considerations
- Secret qua `wrangler secret put GEMINI_API_KEY` + `APP_PASSCODE` (prod); `.dev.vars` (dev, gitignored).
- Constant-time so passcode; 401 không lộ chi tiết.
- Không log key/passcode. Không trả raw Gemini error ra client (map sang code).

## Next Steps
- Mở khóa Phase 02 (chat) — dùng `streamGemini` + `ai-client.postStream` + gate.
