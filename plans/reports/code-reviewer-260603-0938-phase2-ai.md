# Code Review — Phase 2 AI (Worker proxy + React frontend)

Date: 2026-06-03 | Reviewer: code-reviewer | Scope: Phase 2 additions
Build/typecheck/smoke: PASS (per task). Scale: 1-2 learners. Weighted by real-world impact.

## Overall Assessment

Solid, well-factored work. Clear separation (lib/handlers/prompts), DRY shared contracts, constant-time passcode, API key never crosses to client, defensive AI-JSON parsing, StrictMode guards present. No Critical issues. Most findings are Low/Medium edge cases that rarely bite at 1-2 users but are cheap to note. Two correctness bugs worth fixing (High/Medium).

---

## Critical

None. API key stays server-side (`x-goog-api-key` set only in `worker/lib/gemini-client.ts:32`, never serialized to client). Passcode compared constant-time, never echoed back.

---

## High

### H1. SSE final-buffer loss if stream ends without trailing `\n\n`
`src/lib/ai-client.ts:70-85` (client) and `worker/lib/gemini-client.ts:59-77` (worker).
Both parsers only act on complete delimiter-terminated chunks (`\n\n` client, `\n` worker) and never flush the residual `buffer` after `done`. If the upstream closes the stream with a final event not terminated by the delimiter, that last event is silently dropped.
- Worker side: Gemini `alt=sse` lines are `\n`-terminated, so usually safe — but a final partial line on close is lost.
- Client side: worker always writes `\n\n`-terminated blocks AND a terminal `event: done\ndata:...\n\n`, so in practice the last *token* block is always followed by `done`. The real risk is the **`done` event itself** arriving in a final chunk without trailing `\n\n` — harmless (done is a no-op). So impact is low *given the current worker*, but the parser is fragile to any upstream that doesn't terminate the last frame.
- Impact at scale: low (current worker always terminates frames). Recommend a post-loop flush of remaining `buffer` for robustness. Severity High only because it's a streaming-correctness class bug; real impact here is modest.

### H2. `event: error` mid-stream discards already-streamed text in the hook
`src/hooks/use-ai-chat.ts:61-64`, `src/hooks/use-conversation.ts:42-44`.
When worker hits a Gemini error *after* some tokens streamed (e.g. quota mid-response), `postStream` throws; the catch sets errorCode and removes the model bubble **only if empty** (`!m.text`). Good — partial text is kept. But the *user* never learns the answer was truncated vs. complete; only the banner shows. Minor UX, acceptable. No data loss. Downgrade to Medium in practice — flagged because the error-after-partial path is the one not exercised by smoke tests (no real key).

---

## Medium

### M1. `done` event detection relies on event name, but worker `[DONE]` sentinel never sent
`worker/lib/gemini-client.ts:69` skips `[DONE]`, but Gemini `alt=sse` does not emit `[DONE]` (that's OpenAI). Harmless dead branch — KISS suggests removing, but leave if defensive. Low/Medium.

### M2. Rate-limit bucket map never evicted — unbounded growth
`worker/lib/rate-limit.ts:9` `buckets` Map grows one entry per unique IP for the isolate's lifetime. At 1-2 users this is a non-issue, but it's an unbounded data structure keyed by attacker-controllable `cf-connecting-ip` (Cloudflare sets this, not spoofable from client, so bounded in practice). Acceptable at scale; note for awareness. No action needed.

### M3. Health endpoint reveals worker liveness pre-auth (intended) — fine
`worker/index.ts:20` `/api/health` bypasses passcode. Returns only `{ok:true}`, no secrets. Acceptable and intended. No leak.

### M4. `grade` translate mode: empty `prompt` still sent to AI
`worker/handlers/grade-handler.ts` + `grade-prompt.ts:40-43`. In translate mode with empty `prompt`, the user prompt embeds `Câu tiếng Việt gốc: ""`. Client (`sentence-grader.tsx:34`) always sends `prompt.trim()` even in check mode (unused there) and doesn't require prompt in translate mode. Result: AI grades a translation with no source sentence. Low-impact (AI degrades gracefully), but consider requiring `prompt` when `mode==='translate'`. Medium.

### M5. Prompt injection via user text into Gemini (inherent, low risk here)
User `text`/`messages` are interpolated into prompts (`grade-prompt.ts`, chat history). A learner could try to jailbreak the tutor persona. At 1-2 trusted users this is irrelevant; no system-prompt leak risk of value (no secrets in prompts). No action.

---

## Low

### L1. `idCounter`/`cid` are module-global, shared across hook instances
`use-ai-chat.ts:15`, `use-conversation.ts:11`. Fine (monotonic, only needs uniqueness within a session). React StrictMode double-invoke just burns a couple IDs. No collision risk. No action.

### L2. StrictMode double-effect on conversation opener — guarded, but guard is per-mount-survivable
`conversation-page.tsx:35-42` uses `openedRef` + `key={scenarioId}`. StrictMode double-mounts: `openedRef` is reset on the second real mount (refs are per-instance), so opener could fire twice in dev StrictMode. However `useConversation.open()` (`use-conversation.ts:54-55`) guards with `turnsRef.current.length || abortRef.current` — the second call hits while the first is streaming (`abortRef` set) and returns early. So effectively single-fire. Verify happy-path once a real key exists: the race window is open()→setTurns (async) before abortRef set is synchronous within streamModel, so abortRef guards it. OK. No action, but the one not smoke-tested with real AI.

### L3. `chat` abort leaves no explicit reader cancel
`ai-client.ts:66-85`. On abort the fetch reader isn't explicitly `cancel()`-ed; relying on signal aborting the body. Browsers handle this via the abort signal on fetch. Acceptable.

### L4. `parseAiJson` greedy slice can corrupt valid-but-nested JSON with stray braces in strings
`worker/lib/parse-json.ts:16` `lastIndexOf('}')`/`first '{'`. Since both grade/exercise use `responseMimeType: application/json` + schema, output is already clean JSON — the fence/slice logic is belt-and-suspenders and rarely triggers. Edge: AI output containing `}` inside a trailing explanation after JSON would extend the slice wrongly, but schema-constrained output won't. Low.

### L5. `extractText` only reads `parts[0]` 
`gemini-client.ts:39`. Multi-part responses concatenate only the first part. Gemini text responses are typically single-part; with `maxOutputTokens` caps this is fine. Low — note if you ever see truncated output.

### L6. `not_found_handling: single-page-application` + Worker `/api/*` ordering
`wrangler.jsonc:12`. Confirmed working per smoke tests. One subtlety: any *future* asset whose path starts `/api/` would shadow the route (asset-first). None exist. No action.

### L7. `MAX_OUTPUT_TOKENS=800` for chat but conversation hardcodes 300
`config.ts:12` vs `conversation-handler.ts:47`. Inconsistent (one constant, one literal). Minor DRY nit — conversation's 300 is intentional (short turns). Consider a named constant for clarity. Low.

### L8. Echo handler still wired in production routing
`worker/index.ts:48-49`, `echo-handler.ts`. Comment says "gỡ sau" (remove later). It's behind passcode + rate-limit, harmless, but dead code in prod. Remove when convenient (YAGNI). Low.

---

## Edge Cases Scouted (not shown in diff)

- **Gemini 4xx other than 429** → `GeminiError.code='server'`, mapped to 502 in JSON handlers, surfaced as `server` in SSE. Banner shows generic server error. OK.
- **Empty Gemini stream** (no tokens, immediate done) → model bubble stays empty, removed by `!m.text` filter only on *error*; on success an empty bubble persists showing `…` (chat-message.tsx:21 typing dots) forever. Edge: success-but-empty leaves a stuck typing bubble. Low but real — consider removing empty model bubble on successful `done` too.
- **Passcode in localStorage** is plaintext (by design, shared low-value secret). Fine at scale.
- **`postJson` on 401** → `unauthorized` banner; passcode not auto-cleared, so user stays stuck with bad passcode and no "re-enter" path except clearing storage. No `clearPasscode()` call on 401 anywhere — user with wrong saved passcode can't recover via UI. Medium-ish UX gap (see U-question).
- **AbortError in postStream** returns silently (`ai-client.ts:61,82`) — correct, no error banner on user-initiated stop.

---

## Positive Observations

- Constant-time passcode compare with length-leak-free early return acceptable for this threat model (`auth.ts`).
- API key isolation is clean; no key in types sent to client, no logging of it.
- Shared `ai-contracts.ts` genuinely DRY across worker/client via `tsconfig.worker.json` include.
- `ctx.waitUntil(pipeToSse(...))` correctly keeps the streaming task alive after response returns; `finally { sse.close() }` guarantees stream closure on all paths — no floating-promise/hang.
- Input validation present on every handler (JSON parse guard, length caps, count clamp, vocab filter, exercise structural validation in `isValidExercise`).
- StrictMode guards intentionally placed (opener ref, abort guards in send/reply).
- Streaming parser handles multi-`data:` lines per block (`ai-client.ts:91-96`).

---

## Recommended Actions (prioritized)

1. (H1) Flush residual `buffer` after the read loop in both `postStream` and `streamGemini` for streaming robustness.
2. (Edge) Remove empty model bubble on successful `done`, not just on error, to avoid a stuck `…` typing indicator when Gemini returns no text.
3. (Edge/UX) On `unauthorized` (401), offer a "re-enter passcode" path — e.g. `clearPasscode()` + re-show gate — so a wrong saved passcode is recoverable in-UI.
4. (M4) Require non-empty `prompt` when `mode==='translate'` (client + handler).
5. (L8) Remove echo handler/route before prod, or gate behind a dev flag.
6. (L7) Extract conversation's `maxOutputTokens: 300` to a named config constant.

---

## Metrics

- Type coverage: high (strict tsconfig, `unknown`-based defensive parsing). No `any` of note.
- Test coverage: 0 automated tests for Phase 2 (verified via live smoke only). Happy-path AI text untested (no key). Acceptable for scale but the empty-stream and error-after-partial paths are the riskiest untested ones.
- Linting: clean per task (both builds pass).

---

## Unresolved Questions

1. Is there an intended in-UI recovery for a wrong/changed `APP_PASSCODE` (currently requires clearing localStorage manually)? See action #3.
2. Should `/api/health` stay unauthenticated long-term, or gate it once monitoring is set up? (Currently fine.)
3. Confirm happy-path streaming once a real `GEMINI_API_KEY` is available — specifically the empty-response and quota-mid-stream paths (H2, empty-bubble edge), which smoke tests could not exercise.
4. Is the echo handler intended to ship to prod, or removed before deploy? (L8)
