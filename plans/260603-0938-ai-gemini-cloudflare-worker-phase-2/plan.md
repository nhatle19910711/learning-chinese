---
status: completed
created: 2026-06-03
completed: 2026-06-03
scope: Phase 2 — Tích hợp AI Gemini (free) qua Cloudflare Worker proxy
scale: 1-2 learners (personal); passcode gate, không account
depends_on: Phase 1 MVP (completed)
---

# Plan: Phase 2 — AI Gemini qua Cloudflare Worker Proxy

Thêm 1 Worker fetch handler vào project static hiện tại (đang chạy Cloudflare Workers Static Assets) để **proxy Gemini API miễn phí**, giấu API key. 4 tính năng AI cho người Việt học tiếng Trung: **gia sư chat**, **chấm & sửa câu**, **tạo bài tập động**, **luyện hội thoại**. Streaming SSE cho chat/hội thoại. Cổng bảo vệ bằng **mật khẩu chia sẻ** (chống đốt quota khi deploy public).

## Quyết định đã chốt (user)
- **Bảo vệ proxy:** mật khẩu chia sẻ — nhập 1 lần, lưu `localStorage`, gửi kèm header `x-app-passcode`. Worker so với secret `APP_PASSCODE`.
- **Phạm vi:** cả 4 tính năng, chia phase theo ưu tiên giá trị.
- **Chat UX:** streaming SSE (token hiện dần).

## Context
- README Phase 2: [README.md](../../README.md) (mục "Lộ trình tương lai").
- Research kỹ thuật: [researcher report](../reports/researcher-260603-0938-gemini-cf-worker-proxy.md) — CF routing + Gemini REST/SSE.
- Phase 1 plan (đã xong): [../260602-2135-chinese-learning-website-mvp/plan.md](../260602-2135-chinese-learning-website-mvp/plan.md).

## Kiến trúc tổng

```
Browser (React SPA)                Cloudflare Worker                  Google Gemini
 ai-client.ts ──fetch /api/*──►  worker/index.ts (routing)
   + x-app-passcode               ├─ auth.ts (check passcode)
   SSE reader  ◄──text/event-stream┤─ handlers/* ──► gemini-client.ts ──► generativelanguage…
 passcode-gate.tsx                 └─ else → env.ASSETS.fetch() (SPA)   :streamGenerateContent?alt=sse
```

- **Cùng 1 Worker** phục vụ cả static assets (`./dist`) lẫn `/api/*`. Mặc định asset-first; `/api/*` không khớp file nào → Worker chạy. **Không cần** `run_worker_first`.
- API key Gemini = Worker **secret**, không bao giờ xuống client.
- Frontend chỉ biết các endpoint `/api/*`; không CORS (server-to-server).

## Tech stack bổ sung
- Worker: TypeScript thuần, không framework (KISS). `@cloudflare/workers-types` (dev). Bundle bằng wrangler/esbuild.
- Gemini: REST `v1beta …:streamGenerateContent?alt=sse`, header `x-goog-api-key`. Model = **config constant** `GEMINI_MODEL` (mặc định `gemini-2.5-flash`; xác minh model free mới nhất trên AI Studio trước khi deploy — xem Risk).
- Streaming: `TransformStream` + `ctx.waitUntil()` ở Worker; `ReadableStream` reader ở client.
- Frontend: tái dùng React + react-router + design tokens hiện có. Không thêm UI lib.
- Contracts dùng chung: `src/lib/ai-contracts.ts` (worker import lại → DRY).

## Phases

| # | Phase | Status | Ưu tiên | Mô tả |
|---|-------|--------|---------|-------|
| 01 | [Worker Proxy Foundation & Passcode Gate](phase-01-worker-proxy-foundation-and-passcode-gate.md) | completed | P0 nền tảng | wrangler `main`+`ASSETS`, routing, auth passcode, gemini-client, SSE plumbing, ai-client + passcode-gate frontend, dev/secret setup |
| 02 | [AI Tutor Chat (Streaming)](phase-02-ai-tutor-chat-streaming.md) | completed | P1 | `/api/chat` SSE multi-turn + system prompt gia sư + trang `/tutor` + hook `use-ai-chat` |
| 03 | [Sentence Grading & Correction](phase-03-sentence-grading-and-correction.md) | completed | P1 | `/api/grade` (JSON có cấu trúc) chấm/sửa câu Trung + UI nhập câu, hiện lỗi & gợi ý |
| 04 | [Dynamic Exercise Generation](phase-04-dynamic-exercise-generation.md) | completed | P2 | `/api/exercise` sinh MCQ/dịch từ vựng bài học, cắm vào drill UI hiện có |
| 05 | [Conversation Practice](phase-05-conversation-practice.md) | completed | P2 | `/api/conversation` roleplay SSE + chọn kịch bản + TTS (reuse useSpeech) + hiện pinyin/nghĩa |

## Trạng thái triển khai (2026-06-03)

**Hoàn thành cả 5 phase.** Build `npm run build` pass (93 modules, ~93 KB gzip JS) · worker typecheck pass · smoke test `wrangler dev` pass (routing, passcode 401, SSE, validation, SPA fallback, graceful errors). Code review: 0 critical; đã sửa H1 (flush buffer SSE), kẹt bong bóng rỗng khi AI trả rỗng, phục hồi mật khẩu sai (xóa + nhập lại), guard mode dịch, gỡ echo handler test.

**Routes mới:** `/ai` (hub) · `/tutor` · `/practice/grade` · `/practice/generate` · `/practice/conversation`.
**API mới:** `/api/health` · `/api/chat` · `/api/grade` · `/api/exercise` · `/api/conversation`.

**✅ Đã test live với key thật (gemini-2.5-flash):** cả 4 tính năng chạy đúng — chat streaming (VN + hán tự + pinyin), chấm câu check + translate (JSON đúng), bài tập (5 MCQ hợp lệ, mixed type), hội thoại (AI chào trước + đáp lại đúng format ZH/PINYIN/VI).

**Lỗi đã phát hiện & sửa khi test:** gemini-2.5-flash là **thinking model** — `thoughtsTokenCount` ăn hết `maxOutputTokens` → cụt JSON (`bad_ai_response` ở mode translate). Fix: `thinkingConfig.thinkingBudget: 0` trong [worker/lib/gemini-client.ts](../../worker/lib/gemini-client.ts) `buildBody` (HSK1 không cần thinking; nhanh + rẻ + ổn định hơn). Sau fix: tất cả pass.

**Deploy (cần người dùng):** `wrangler secret put GEMINI_API_KEY` + `APP_PASSCODE`, rồi `npm run deploy`.

## Dependencies
- **01 là nền tảng** → 02, 03, 04, 05 đều phụ thuộc 01 (gemini-client, ai-client, passcode, SSE).
- 02 validate toàn bộ pipeline streaming end-to-end → nên làm ngay sau 01.
- 03, 04, 05 độc lập nhau (có thể song song sau khi 01+02 xong). 05 phụ thuộc pattern streaming của 02 (hook `use-ai-chat`).

## Out of scope (sau Phase 2)
- Account / đồng bộ đa thiết bị, lưu lịch sử chat lên server.
- Turnstile / chống bot nâng cao (chỉ passcode trong phase này).
- Rate-limit phân tán (KV/DO) — phase này chỉ per-isolate nhẹ + passcode.
- Voice input (STT), TTS server-side, MP3 thu sẵn.

## Success criteria
- Worker proxy chạy local (`wrangler dev`) + deploy: `/api/*` hoạt động, static SPA vẫn phục vụ bình thường.
- API key Gemini **không** lộ ra client (kiểm tra Network tab); sai/thiếu passcode → 401.
- 4 tính năng AI chạy: chat & hội thoại stream mượt; chấm câu trả JSON đúng cấu trúc; bài tập sinh đúng từ vựng bài học.
- Xử lý lỗi: 401 (passcode), 429 (hết quota), mất mạng → UI báo rõ tiếng Việt, không crash.
- `npm run build` + `tsc` (cả app lẫn worker) pass, không secret nào bị commit.

## Risk chính
- **Model name:** `gemini-3.5-flash` trong report chưa xác minh được (knowledge cutoff). Dùng constant, mặc định `gemini-2.5-flash`; **xác minh AI Studio** trước deploy. Đổi model = sửa 1 dòng.
- **Đốt quota:** passcode là tuyến phòng thủ chính. Thêm per-isolate rate-limit nhẹ. Free tier ~1500 req/ngày → đủ cho 1-2 người.
- **Chi phí token:** giới hạn `maxOutputTokens`, cắt lịch sử chat (giữ ~8-10 lượt gần nhất).
- **Lệch tsconfig app vs worker:** dùng tsconfig riêng cho worker, generate types bằng `wrangler types`.

## Unresolved questions
- Deploy thật chưa có (cần tài khoản Cloudflare + Gemini key) — plan giả định self-deploy.
- Có cần lưu lịch sử chat ở localStorage giữa các phiên không? (mặc định: KHÔNG, mỗi phiên mới — xác nhận khi làm Phase 02).
