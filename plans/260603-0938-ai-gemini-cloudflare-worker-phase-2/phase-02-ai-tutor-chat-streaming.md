# Phase 02 — AI Tutor Chat (Streaming)

**Priority:** P1
**Status:** planned
**Depends on:** Phase 01

## Context Links
- Nền tảng: [phase-01](phase-01-worker-proxy-foundation-and-passcode-gate.md)
- Gemini multi-turn + SSE: [research](../reports/researcher-260603-0938-gemini-cf-worker-proxy.md)

## Overview
Gia sư AI chat: người Việt hỏi về tiếng Trung (ngữ pháp, pinyin, thanh điệu, từ vựng), AI trả lời tiếng Việt, stream từng token. Multi-turn (nhớ ngữ cảnh trong phiên). Đây cũng là phép thử end-to-end của toàn pipeline streaming.

## Key Insights
- `contents[]` xen kẽ `user`/`model` = lịch sử hội thoại; gửi nguyên mảng mỗi lượt.
- `system_instruction` set persona gia sư (role luôn `"user"`).
- Cắt lịch sử ~8-10 lượt gần nhất để tiết kiệm token (HISTORY_LIMIT ở config).
- Hook `use-ai-chat` tái dùng được cho Phase 05 (hội thoại).

## Requirements
**Functional**
- `POST /api/chat` body `{messages: ChatTurn[]}` → SSE text increments.
- Trang `/tutor`: ô nhập, danh sách tin nhắn, chỉ báo "đang gõ", stream hiện dần, nút dừng (AbortController).
- Gợi ý câu hỏi mẫu (chips) khi chat trống.
- Có thể chèn ngữ cảnh bài học hiện tại (optional): "đang học Bài X" vào system prompt.
- Render hanzi với font CJK; nút TTS cho câu tiếng Trung trong câu trả lời (reuse `useSpeech`) — optional nhẹ.

**Non-functional**
- Hủy request khi rời trang / bấm dừng.
- Lỗi 429/network → `ai-error-banner`, giữ lịch sử, cho thử lại.

## Architecture
```
worker/handlers/chat-handler.ts     # build system+contents, gọi streamGemini, ghi SSE
worker/prompts/tutor-system-prompt.ts

src/hooks/use-ai-chat.ts            # state messages[], send(), stop(), streaming flag
src/components/tutor/tutor-page.tsx # route /tutor
src/components/tutor/chat-message.tsx
src/components/tutor/chat-input.tsx
src/components/tutor/chat.css
```

## Related Code Files
**Create:** `worker/handlers/chat-handler.ts`, `worker/prompts/tutor-system-prompt.ts`, `src/hooks/use-ai-chat.ts`, `src/components/tutor/{tutor-page.tsx,chat-message.tsx,chat-input.tsx,chat.css}`
**Modify:** `worker/index.ts` (route `/api/chat`), `src/main.tsx` (route `/tutor`), `src/components/layout/app-header.tsx` (link Gia sư AI), `src/lib/ai-contracts.ts` (ChatRequest)

## Implementation Steps
1. `tutor-system-prompt.ts`: persona tiếng Việt — "Bạn là gia sư tiếng Trung thân thiện cho người Việt mới bắt đầu. Luôn trả lời bằng tiếng Việt, kèm hanzi + pinyin + nghĩa khi đưa ví dụ. Giải thích ngắn gọn, có ví dụ. Nếu người học viết sai pinyin/hán tự, sửa nhẹ nhàng." + format guidance.
2. `chat-handler.ts`: validate `messages[]`; map sang `contents[]` (`user`/`model`); cắt còn `HISTORY_LIMIT`; gọi `streamGemini({system, contents, generationConfig:{maxOutputTokens}})`; pipe qua `sse.ts`; bắt lỗi → SSE event `error` rồi close.
3. `worker/index.ts`: thêm dispatch `/api/chat` → `chatHandler`.
4. `use-ai-chat.ts`: `messages` state; `send(text)` push user turn → gọi `ai-client.postStream('/api/chat', {messages}, onToken)` append vào model turn cuối; `stop()` abort; expose `isStreaming`, `error`. Tham số hóa `endpoint` + `systemContext` để Phase 05 tái dùng.
5. UI: `chat-message.tsx` (bubble user/model, render xuống dòng, nút TTS cho đoạn hán tự), `chat-input.tsx` (textarea + Enter gửi, Shift+Enter xuống dòng, nút dừng khi streaming), `tutor-page.tsx` ghép + `passcode-gate` bọc ngoài + chips gợi ý.
6. `chat.css` theo design tokens (dark mode), responsive mobile.
7. Route `/tutor` trong `main.tsx`; thêm link header.
8. Test: hỏi "Phân biệt 你 và 您", kiểm stream, multi-turn nhớ ngữ cảnh, nút dừng, 429 banner.

## Todo List
- [ ] `tutor-system-prompt.ts`
- [ ] `chat-handler.ts` + route `/api/chat`
- [ ] `use-ai-chat.ts` (tham số hóa endpoint)
- [ ] `chat-message.tsx`, `chat-input.tsx`, `tutor-page.tsx`, `chat.css`
- [ ] Route `/tutor` + link header
- [ ] Test stream/multi-turn/stop/error

## Success Criteria
- Chat stream mượt, nhớ ngữ cảnh trong phiên, dừng được giữa chừng.
- Câu trả lời tiếng Việt, ví dụ có hanzi+pinyin, TTS đọc được hán tự.
- Build + tsc pass.

## Risk Assessment
- **Lịch sử phình token** → cắt HISTORY_LIMIT + maxOutputTokens.
- **StrictMode double-effect** → quản AbortController cẩn thận, tránh gửi 2 lần.
- **Markdown trong câu trả lời** → render plain + xuống dòng (KISS, không thêm lib markdown trừ khi cần).

## Security Considerations
- Vẫn qua passcode gate + rate-limit của Phase 01.
- Không gửi PII; chỉ nội dung học.

## Next Steps
- Phase 03 (chấm câu) & 05 (hội thoại, tái dùng `use-ai-chat`).
