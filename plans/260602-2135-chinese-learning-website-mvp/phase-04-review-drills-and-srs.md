# Phase 04 — Review Drills & Lite SRS

**Priority:** High · **Status:** pending · **Depends:** Phase 02, 03

## Overview
4 loại bài ôn tập + lite SRS (đánh dấu "đã thuộc / cần ôn"). Tái dùng use-speech (phase 03).

## Key insights
- "Lite SRS" = đủ cho 1-2 user: mỗi từ có trạng thái `new | learning | known`; ưu tiên hiện từ `learning`/`new` nhiều hơn. KHÔNG cần thuật toán SM-2 phức tạp (YAGNI).
- 4 drill dùng chung nguồn vocab + chung khung câu hỏi → tách `drill-engine` (DRY).

## Requirements
- 4 loại drill:
  1. **Flashcard**: hiện hanzi → lật xem pinyin+nghĩa; tự đánh giá "Thuộc/Chưa".
  2. **Trắc nghiệm nghĩa**: hanzi → chọn nghĩa tiếng Việt (4 lựa chọn).
  3. **Nghe chọn chữ**: phát audio (use-speech) → chọn hanzi đúng (4 lựa chọn).
  4. **Tone drill**: hiện hanzi/nghe → chọn thanh điệu đúng (dựa `tones`).
- Phản hồi đúng/sai tức thì; cuối phiên hiện điểm.
- Cập nhật trạng thái SRS từ kết quả (đúng → tiến tới known; sai → về learning).

## Architecture
```
src/
├── lib/
│   ├── drill-engine.ts           # sinh câu hỏi, trộn đáp án nhiễu, chấm
│   └── srs-lite.ts               # tính trạng thái new/learning/known
├── components/review/
│   ├── review-page.tsx           # /review/:id : chọn loại drill, chạy phiên
│   ├── drill-flashcard.tsx
│   ├── drill-multiple-choice.tsx # dùng cho nghĩa + nghe chọn chữ (cấu hình prompt)
│   ├── drill-tone.tsx
│   └── review-summary.tsx        # điểm + từ sai
```

## Related files
- Create: file trên. Modify: route `/review/:id`; lesson-page link (đã có ở P03).
- Phụ thuộc progress store (Phase 05) — tạm dùng state cục bộ, nối store ở P05.

## Implementation steps
1. `drill-engine.ts`: từ `vocab[]` sinh câu hỏi mỗi loại; hàm trộn (Fisher-Yates) chọn 3 đáp án nhiễu + 1 đúng; chấm đúng/sai.
2. `srs-lite.ts`: `nextStatus(current, isCorrect)` (new→learning→known; sai lùi 1 bậc) + `pickReviewOrder(vocab, statuses)` ưu tiên new/learning.
3. `drill-flashcard.tsx`: lật thẻ (CSS flip), nút Thuộc/Chưa.
4. `drill-multiple-choice.tsx`: prop `mode: 'meaning' | 'listen'`; mode listen render nút 🔊 (use-speech) thay hanzi prompt.
5. `drill-tone.tsx`: chọn thanh điệu (1-4 + khinh thanh) cho từ; có thể kèm audio.
6. `review-page.tsx`: chọn loại drill (hoặc "Ôn tổng hợp"), chạy N câu (vd 10), thu kết quả → cập nhật SRS → `review-summary`.
7. `review-summary.tsx`: điểm, danh sách từ sai (kèm 🔊), nút "Ôn lại từ sai".
8. Test 4 drill: đáp án đúng/sai chấm đúng; audio drill phát; responsive phone + laptop.

## Todo
- [ ] drill-engine (sinh câu, nhiễu, chấm)
- [ ] srs-lite (status + thứ tự ôn)
- [ ] drill-flashcard
- [ ] drill-multiple-choice (meaning + listen)
- [ ] drill-tone
- [ ] review-page (chọn loại, chạy phiên)
- [ ] review-summary (điểm + từ sai)
- [ ] Test 4 drill + responsive

## Success criteria
- 4 drill chạy đúng, chấm chính xác, phản hồi tức thì; SRS cập nhật trạng thái; summary hiện điểm + từ sai; tốt trên phone + laptop.

## Risks
- Đáp án nhiễu trùng đáp án đúng → đảm bảo unique khi trộn.
- Bài ít từ (<4) → giảm số lựa chọn hoặc gộp nhiều bài cho đủ nhiễu.

## Next
→ Phase 05 (persistence + deploy).
