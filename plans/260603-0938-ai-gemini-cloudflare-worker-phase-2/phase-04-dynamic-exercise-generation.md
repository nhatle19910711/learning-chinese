# Phase 04 — Dynamic Exercise Generation

**Priority:** P2
**Status:** planned
**Depends on:** Phase 01 (và tái dùng drill UI Phase 1)

## Context Links
- Drill engine hiện có: [../../src/lib/drill-engine.ts](../../src/lib/drill-engine.ts), [../../src/components/review/](../../src/components/review/)
- Content schema: [../../src/content/content-types.ts](../../src/content/content-types.ts)
- Nền tảng: [phase-01](phase-01-worker-proxy-foundation-and-passcode-gate.md)

## Overview
AI sinh bài tập động từ từ vựng bài học (hoặc chủ đề tự do): câu hỏi trắc nghiệm, điền chỗ trống, dịch ngắn. Mục tiêu **tái dùng UI drill hiện có** thay vì dựng mới — AI chỉ sinh dữ liệu khớp schema.

## Key Insights
- Trước khi code: **đọc `drill-engine.ts` + `mcq-question-card.tsx`** để khớp đúng kiểu dữ liệu drill hiện tại → AI sinh đúng shape đó, cắm thẳng vào component cũ (DRY).
- `generateGeminiJson` + `responseSchema` ép cấu trúc.
- Truyền danh sách từ vựng bài học vào prompt để bài tập bám sát nội dung đã học (tránh từ ngoài phạm vi).

## Requirements
**Functional**
- `POST /api/exercise` body `{lessonId?:string, vocab?:VocabItem[], topic?:string, count:number, types:('mcq'|'fill'|'translate')[]}` → `Exercise[]` khớp schema drill.
- UI: chọn bài học (hoặc chủ đề) + số câu → "Tạo bài tập" → render bằng drill UI hiện có; chấm tại chỗ; nút tạo bộ mới.
- Validate output: lọc câu thiếu đáp án/sai shape trước khi render.

**Non-functional**
- Giới hạn `count` (vd ≤10) chống đốt token.
- Fallback nếu AI trả ít/hỏng câu → dùng số câu hợp lệ, báo nhẹ.

## Architecture
```
worker/handlers/exercise-handler.ts
worker/prompts/exercise-prompt.ts      # system + responseSchema khớp drill shape
src/components/exercise/ai-exercise-panel.tsx   # route /practice/generate
src/components/exercise/exercise-setup.tsx       # chọn bài/chủ đề/số câu
src/lib/ai-exercise-adapter.ts          # map Exercise (AI) → drill data hiện có + validate
```

## Related Code Files
**Read trước:** `src/lib/drill-engine.ts`, `src/components/review/{mcq-question-card,drill-flashcard,review-page}.tsx` (khớp kiểu dữ liệu)
**Create:** `worker/handlers/exercise-handler.ts`, `worker/prompts/exercise-prompt.ts`, `src/components/exercise/{ai-exercise-panel.tsx,exercise-setup.tsx}`, `src/lib/ai-exercise-adapter.ts`
**Modify:** `worker/index.ts` (route), `src/lib/ai-contracts.ts` (`Exercise`, `ExerciseRequest`), `src/main.tsx` (route `/practice/generate`), `app-header.tsx`, `src/content/content-index.ts` (lấy vocab theo lessonId)

## Implementation Steps
1. Đọc drill-engine + review components → xác định kiểu drill (prompt, options, đáp án) để định nghĩa `Exercise` contract ăn khớp.
2. `ai-contracts.ts`: `Exercise`, `ExerciseRequest`.
3. `exercise-prompt.ts`: yêu cầu sinh bài tập từ danh sách từ vựng cho trước, tiếng Việt cho phần hướng dẫn/giải thích, mỗi câu có đáp án đúng + (mcq) distractors hợp lý + giải thích ngắn. `responseSchema` = mảng `Exercise`.
4. `exercise-handler.ts`: nếu có `lessonId` → server không có content (content nằm client) → **client gửi kèm `vocab[]`** lấy từ `content-index`. Validate count/types; gọi `generateGeminiJson`; trả mảng đã lọc.
5. `ai-exercise-adapter.ts`: validate từng `Exercise` (đủ field, đáp án nằm trong options), map sang shape drill UI; bỏ câu hỏng.
6. `exercise-setup.tsx`: chọn bài học (từ content-index) hoặc nhập chủ đề, số câu, loại; `ai-exercise-panel.tsx`: gọi API → adapter → render drill UI cũ + chấm.
7. Route `/practice/generate` + link header. Test: sinh 5 MCQ từ Bài 1 chào hỏi.

## Todo List
- [ ] Đọc drill-engine/review để khớp shape
- [ ] `Exercise`/`ExerciseRequest` contracts
- [ ] `exercise-prompt.ts` (+responseSchema)
- [ ] `exercise-handler.ts` + route
- [ ] `ai-exercise-adapter.ts` (validate+map)
- [ ] `exercise-setup.tsx`, `ai-exercise-panel.tsx`
- [ ] Route `/practice/generate` + link header
- [ ] Test sinh MCQ từ bài học + render bằng UI cũ

## Success Criteria
- Sinh bài tập bám từ vựng bài đã chọn, render bằng drill UI hiện có, chấm đúng.
- Câu hỏng bị lọc, không crash.
- Build + tsc pass.

## Risk Assessment
- **Shape lệch drill cũ** → đọc kỹ trước, validate ở adapter. Nếu khác quá → tạo renderer tối giản riêng (cuối cùng mới làm).
- **Đáp án sai/distractor trùng** → nhiệt độ thấp + validate (đáp án ∈ options, options unique).

## Security Considerations
- Passcode gate + giới hạn `count`.

## Next Steps
- Phase 05 (hội thoại) — phase AI cuối.
