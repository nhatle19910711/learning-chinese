# Phase 03 — Sentence Grading & Correction

**Priority:** P1
**Status:** planned
**Depends on:** Phase 01

## Context Links
- Nền tảng: [phase-01](phase-01-worker-proxy-foundation-and-passcode-gate.md) (dùng `generateGeminiJson`)

## Overview
Người học nhập 1 câu tiếng Trung (hoặc dịch Việt→Trung), AI chấm: đúng/sai, sửa câu, giải thích lỗi bằng tiếng Việt, gợi ý cải thiện. Trả **JSON có cấu trúc** (không stream) → render gọn, đáng tin.

## Key Insights
- Dùng `generateContent` (non-stream) + `responseMimeType: "application/json"` + `responseSchema` để ép Gemini trả JSON đúng cấu trúc → parse an toàn.
- Hai chế độ: (a) kiểm tra 1 câu Trung; (b) dịch Việt→Trung rồi chấm bản dịch người học.

## Requirements
**Functional**
- `POST /api/grade` body `{mode:'check'|'translate', text:string, prompt?:string}` (prompt = câu Việt gốc khi mode translate).
- Trả `GradeResult { correct:boolean, corrected:string, correctedPinyin:string, issues:{span,explanationVi}[], suggestionVi:string, score?:number }`.
- UI: ô nhập, chọn chế độ, nút "Chấm"; hiện câu sửa (highlight khác biệt), danh sách lỗi tiếng Việt, nút TTS đọc câu đúng.

**Non-functional**
- Parse JSON phòng thủ (Gemini đôi khi bọc ```json) → strip fence, try/catch, fallback message.
- Giới hạn độ dài input (vd 200 ký tự) chống abuse.

## Architecture
```
worker/handlers/grade-handler.ts
worker/prompts/grade-prompt.ts        # system + responseSchema
src/components/grade/sentence-grader.tsx   # route /practice/grade (hoặc panel)
src/components/grade/grade-result-view.tsx
src/components/grade/grade.css
```

## Related Code Files
**Create:** `worker/handlers/grade-handler.ts`, `worker/prompts/grade-prompt.ts`, `src/components/grade/{sentence-grader.tsx,grade-result-view.tsx,grade.css}`
**Modify:** `worker/index.ts` (route `/api/grade`), `worker/lib/gemini-client.ts` (đảm bảo `generateGeminiJson` nhận `responseSchema`), `src/lib/ai-contracts.ts` (`GradeResult`, `GradeRequest`), `src/main.tsx` (route `/practice/grade`), `app-header.tsx` (link)

## Implementation Steps
1. `ai-contracts.ts`: định nghĩa `GradeResult`, `GradeRequest`.
2. `grade-prompt.ts`: system instruction (chấm câu cho người Việt, sửa + giải thích tiếng Việt, đưa pinyin) + `responseSchema` (object đúng `GradeResult`) + `responseMimeType:"application/json"`.
3. `grade-handler.ts`: validate (mode, length); gọi `generateGeminiJson`; strip ```json fence nếu có; parse; lỗi parse → 502 `{code:'bad_ai_response'}`.
4. `worker/index.ts`: route `/api/grade`.
5. `sentence-grader.tsx`: form (toggle check/translate, input, mode translate hiện ô câu Việt gốc), gọi `ai-client.postJson`, `passcode-gate` bọc ngoài.
6. `grade-result-view.tsx`: badge đúng/sai, câu sửa + pinyin + TTS, list lỗi (span + giải thích VI), gợi ý. Highlight khác biệt đơn giản (so token).
7. `grade.css` design tokens, dark mode, responsive.
8. Route + link header. Test: câu sai "我是学生吗。" / dịch "Tôi tên là Nam".

## Todo List
- [ ] `GradeResult`/`GradeRequest` trong ai-contracts
- [ ] `grade-prompt.ts` (+ responseSchema)
- [ ] `grade-handler.ts` + route `/api/grade`
- [ ] `sentence-grader.tsx`, `grade-result-view.tsx`, `grade.css`
- [ ] Route `/practice/grade` + link header
- [ ] Test 2 chế độ + lỗi parse

## Success Criteria
- Nhập câu sai → trả câu sửa + lỗi giải thích tiếng Việt, parse JSON ổn định.
- Mode translate chấm bản dịch hợp lý.
- Build + tsc pass.

## Risk Assessment
- **Gemini không trả JSON thuần** → responseSchema + strip fence + try/catch.
- **Chấm sai/ảo** → nêu rõ "AI có thể sai", cho người học tự xét; nhiệt độ thấp (temperature ~0.3).

## Security Considerations
- Passcode gate + giới hạn độ dài input.

## Next Steps
- Phase 04 (bài tập động) dùng lại pattern `generateGeminiJson` + responseSchema.
