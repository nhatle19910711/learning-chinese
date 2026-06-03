# Phase 05 — Conversation Practice (Roleplay)

**Priority:** P2
**Status:** planned
**Depends on:** Phase 01 + Phase 02 (tái dùng `use-ai-chat`, SSE)

## Context Links
- Chat hook tái dùng: [phase-02](phase-02-ai-tutor-chat-streaming.md)
- TTS reuse: [../../src/hooks/use-speech.ts](../../src/hooks/use-speech.ts)

## Overview
Luyện hội thoại tình huống: AI đóng vai (nhân viên quán, người mới quen…) nói **tiếng Trung**, người học đáp lại; mỗi lượt AI hiện hanzi + pinyin + nghĩa Việt, đọc TTS, và (tùy chọn) gợi ý câu nên nói. Stream SSE.

## Key Insights
- Tái dùng `use-ai-chat` (đã tham số hóa endpoint + systemContext ở Phase 02) → endpoint `/api/conversation`.
- Mỗi lượt model trả 1 đoạn JSON-trong-stream khó; thay vào đó: stream phần hội thoại tiếng Trung, kèm pinyin/nghĩa sinh **cùng câu** theo format cố định (vd dòng `ZH: …` / `PINYIN: …` / `VI: …`) rồi client tách. KISS hơn structured streaming.
- TTS đọc phần hán tự qua `useSpeech` (đã có fallback pinyin).
- Kịch bản = preset system prompt (chào hỏi, mua đồ, gọi món, hỏi đường…).

## Requirements
**Functional**
- `POST /api/conversation` body `{scenarioId, messages: ChatTurn[]}` → SSE; AI mở lời trước khi người học nhập (lượt đầu messages rỗng → AI chào).
- Trang `/practice/conversation`: chọn kịch bản → bắt đầu; bong bóng hội thoại có hanzi+pinyin+nghĩa, nút TTS, nút "gợi ý câu đáp"; ô nhập (gõ hán tự / pinyin).
- Nút kết thúc → AI nhận xét ngắn (tiếng Việt) về phần thể hiện.

**Non-functional**
- Hủy/dừng stream; cắt lịch sử HISTORY_LIMIT.
- Mức độ khó theo kịch bản (giữ trong phạm vi HSK1 cho phù hợp Phase 1).

## Architecture
```
worker/handlers/conversation-handler.ts
worker/prompts/conversation-scenarios.ts   # map scenarioId → system prompt
src/components/conversation/conversation-page.tsx   # route /practice/conversation
src/components/conversation/scenario-picker.tsx
src/components/conversation/dialogue-turn.tsx        # parse ZH/PINYIN/VI + TTS
src/components/conversation/conversation.css
src/lib/conversation-turn-parser.ts          # tách ZH/PINYIN/VI từ text stream
```

## Related Code Files
**Reuse:** `src/hooks/use-ai-chat.ts` (Phase 02), `src/hooks/use-speech.ts`, `src/components/ai/{passcode-gate,ai-error-banner}.tsx`
**Create:** `worker/handlers/conversation-handler.ts`, `worker/prompts/conversation-scenarios.ts`, `src/lib/conversation-turn-parser.ts`, `src/components/conversation/{conversation-page,scenario-picker,dialogue-turn}.tsx`, `conversation.css`
**Modify:** `worker/index.ts` (route), `src/lib/ai-contracts.ts` (`ConversationRequest`, `Scenario`), `src/main.tsx` (route), `app-header.tsx`

## Implementation Steps
1. `conversation-scenarios.ts`: list kịch bản + system prompt mỗi cái ("Bạn đóng vai nhân viên quán cà phê, nói tiếng Trung đơn giản (HSK1). Mỗi lượt trả đúng format: ZH: <hán tự>\nPINYIN: <pinyin>\nVI: <nghĩa>. Giữ câu ngắn. Nếu người học sai, vẫn tiếp tục hội thoại tự nhiên.").
2. `conversation-handler.ts`: lấy system theo `scenarioId`; map messages→contents; nếu rỗng → prompt AI chào trước; `streamGemini` → SSE.
3. `worker/index.ts`: route `/api/conversation`.
4. `conversation-turn-parser.ts`: từ text tích lũy, tách `ZH/PINYIN/VI` (chịu được lúc đang stream dở → parse incremental, hiện dần phần ZH trước).
5. `scenario-picker.tsx`: grid kịch bản. `dialogue-turn.tsx`: hiện ZH lớn (font CJK) + pinyin + nghĩa + nút TTS (`useSpeech`). `conversation-page.tsx`: dùng `use-ai-chat({endpoint:'/api/conversation', extra:{scenarioId}})`, nút gợi ý (gọi chat hỏi "gợi ý 1 câu đáp"), nút kết thúc (nhận xét).
6. `conversation.css` design tokens, responsive, dark mode.
7. Route + link header. Test kịch bản "gọi món", kiểm stream + parse + TTS + nhận xét cuối.

## Todo List
- [ ] `conversation-scenarios.ts` (3-5 kịch bản HSK1)
- [ ] `conversation-handler.ts` + route `/api/conversation`
- [ ] `conversation-turn-parser.ts`
- [ ] `scenario-picker.tsx`, `dialogue-turn.tsx`, `conversation-page.tsx`, `conversation.css`
- [ ] Reuse `use-ai-chat` + `useSpeech`
- [ ] Route `/practice/conversation` + link header
- [ ] Test stream/parse/TTS/nhận xét

## Success Criteria
- AI mở lời, hội thoại nhiều lượt stream mượt; mỗi lượt có ZH+pinyin+nghĩa, TTS đọc được.
- Kết thúc → nhận xét tiếng Việt.
- Build + tsc pass.

## Risk Assessment
- **Parse format ZH/PINYIN/VI khi streaming dở** → parser khoan dung, hiện phần đã đủ; nếu lệch format → fallback hiện raw text.
- **AI nói quá khó** → ràng buộc HSK1 + câu ngắn trong prompt.

## Security Considerations
- Passcode gate + rate-limit + HISTORY_LIMIT.

## Next Steps
- Cập nhật README (xóa "chưa làm"), cập nhật `docs/` nếu cần, cân nhắc deploy thật (cần tài khoản Cloudflare + Gemini key).
