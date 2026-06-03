# Phase 02 — Content Data Model & Lessons

**Priority:** High · **Status:** pending · **Depends:** Phase 01 (một phần song song được)

## Overview
Định nghĩa schema nội dung (TS types), viết nội dung JSON: Bài 0 Pinyin/4 thanh điệu + 5 bài HSK1 (~150 từ), và content loader.

## Key insights
- Nội dung tách khỏi code (JSON) → thêm/sửa bài không đụng logic (DRY, dễ mở rộng Phase 2).
- ~150 từ HSK1 chia 5 chủ đề (~30 từ/bài). Nội dung do AI tạo nhưng PHẢI review độ chính xác (pinyin, dấu thanh, nghĩa tiếng Việt).
- `tones`: mảng số thanh điệu mỗi âm tiết (1-4, 0=khinh thanh) — dùng cho tone drill + tô màu thanh điệu.

## Requirements
- TS types cho Lesson, VocabItem, PinyinLesson.
- 6 file nội dung: `pinyin-tones` + 5 HSK1.
- Loader trả danh sách bài + bài theo id.

## Architecture
```
src/content/
├── content-types.ts              # TS interfaces
├── content-index.ts              # import + export tất cả lessons, getLessonById
├── lessons/
│   ├── lesson-00-pinyin-tones.json
│   ├── lesson-01-greetings.json        # chào hỏi & lịch sự
│   ├── lesson-02-numbers-age.json      # số đếm & tuổi
│   ├── lesson-03-pronouns-family.json  # đại từ & gia đình
│   ├── lesson-04-time-dates.json       # thời gian, ngày tháng
│   └── lesson-05-daily-objects.json    # hoạt động & đồ vật hằng ngày
```

### Schema
```ts
// content-types.ts
export interface VocabItem {
  hanzi: string;       // 你好
  pinyin: string;      // "nǐ hǎo"
  vi: string;          // "xin chào"
  tones: number[];     // [3,3]  (0=khinh thanh)
  example?: { hanzi: string; pinyin: string; vi: string };
}
export interface Lesson {
  id: string;          // "lesson-01-greetings"
  order: number;       // 1
  title: string;       // "Bài 1: Chào hỏi"
  level: 'pinyin' | 'HSK1';
  intro: string;       // giải thích tiếng Việt ngắn
  vocab: VocabItem[];
}
// Bài 0 pinyin: tái dùng Lesson, vocab = các âm/ví dụ thanh điệu (mā má mǎ mà...)
```

## Related files
- Create: `content-types.ts`, `content-index.ts`, 6 JSON.
- Modify: `home-page.tsx` (render danh sách từ `content-index`).

## Implementation steps
1. Viết `content-types.ts`.
2. Soạn `lesson-00-pinyin-tones.json`: giới thiệu 4 thanh điệu + khinh thanh, bộ ví dụ kinh điển `mā má mǎ mà ma`, vài âm tiết cơ bản (b/p/m, a/o/e, thanh điệu). intro tiếng Việt giải thích thanh điệu.
3. Soạn 5 JSON HSK1 (~30 từ/bài) — chủ đề như trên; mỗi từ có hanzi/pinyin/vi/tones, ưu tiên thêm `example` câu ngắn HSK1.
4. `content-index.ts`: import 6 JSON, sort theo `order`, export `lessons[]` + `getLessonById(id)`.
5. Nối `home-page.tsx`: list card mỗi bài (title, level, số từ) link tới `/lesson/:id`.
6. **Review nội dung**: kiểm pinyin + dấu thanh + nghĩa tiếng Việt khớp hanzi (dùng nguồn HSK1 chuẩn).

## Todo
- [ ] content-types.ts
- [ ] lesson-00 pinyin/thanh điệu
- [ ] 5 JSON HSK1 (~150 từ tổng)
- [ ] content-index loader
- [ ] home-page render danh sách
- [ ] Review độ chính xác nội dung

## Success criteria
- 6 bài load đúng, home hiển thị danh sách, click vào ra đúng bài (route stub ok); JSON hợp lệ với types; nội dung được review đúng.

## Risks
- Nội dung AI sai pinyin/nghĩa → người mới học sai. Mitigation: đối chiếu danh sách HSK1 chuẩn; giữ ~30 từ/bài để dễ kiểm.

## Next
→ Phase 03 (lesson view + audio + stroke order).
