# Phase 03 — Lesson View, Audio & Stroke Order

**Priority:** High · **Status:** pending · **Depends:** Phase 01, 02

## Overview
Trang bài giảng: hiển thị từ vựng (hanzi+pinyin+nghĩa), nút phát âm (Web Speech API + fallback), và nét viết hanzi (hanzi-writer).

## Key insights
- Web Speech API: giọng zh-CN phụ thuộc thiết bị. PHẢI detect `getVoices()` (load bất đồng bộ qua event `voiceschanged`). Thiếu giọng → disable nút + tooltip, vẫn hiện pinyin.
- `rate ~0.8` cho người mới nghe rõ.
- hanzi-writer vẽ từng ký tự → với từ nhiều ký tự (你好) render mỗi ký tự một canvas.

## Requirements
- Lesson page `/lesson/:id`: intro + danh sách vocab card.
- Vocab card: hanzi (font lớn), pinyin (tô màu theo thanh điệu — tùy chọn), nghĩa tiếng Việt, nút 🔊, nút xem nét viết.
- Audio hook tái dùng (dùng lại ở review phase 04).
- Stroke order modal/expand dùng hanzi-writer.

## Architecture
```
src/
├── hooks/
│   └── use-speech.ts             # speak(text, {rate}); voices zh-CN; isSupported
├── components/lesson/
│   ├── lesson-page.tsx           # load lesson theo :id, render intro + list
│   ├── vocab-card.tsx            # 1 từ: hanzi/pinyin/vi + audio + stroke btn
│   ├── audio-button.tsx          # nút 🔊 dùng use-speech, trạng thái thiếu giọng
│   ├── pinyin-text.tsx           # render pinyin, tô màu theo tones (optional)
│   └── stroke-order-viewer.tsx   # hanzi-writer cho từng ký tự
└── lib/
    └── tone-colors.ts            # map thanh điệu → màu (chuẩn phổ biến)
```

## Related files
- Create: file trên. Modify: route `/lesson/:id` trong router.
- Deps: `npm i hanzi-writer`.

## Implementation steps
1. `use-speech.ts`: load voices (xử lý `voiceschanged`), lọc `lang.startsWith('zh')`; `speak(text, rate=0.8)` set `utterance.lang='zh-CN'`, chọn voice zh nếu có; expose `isSupported` (có voice zh + `speechSynthesis` tồn tại).
2. `audio-button.tsx`: gọi `speak(hanzi)`; nếu `!isSupported` → nút mờ + title "Thiết bị chưa có giọng tiếng Trung".
3. `tone-colors.ts` + `pinyin-text.tsx`: tô màu âm tiết theo `tones` (1=đỏ,2=cam,3=lục,4=lam,0=xám — màu phổ biến); fallback hiển thị pinyin thường.
4. `stroke-order-viewer.tsx`: với mỗi ký tự trong hanzi, tạo `HanziWriter.create(...)`; nút "Xem nét viết"/animate, "Vẽ lại".
5. `vocab-card.tsx`: ghép hanzi + pinyin-text + vi + audio-button + nút stroke (mở viewer inline/modal). Responsive: 1 cột phone, lưới 2-3 cột laptop.
6. `lesson-page.tsx`: `getLessonById`; render intro (tiếng Việt) + danh sách vocab-card; nút "Ôn tập bài này" → `/review/:id`.
7. Test: audio trên Chrome (có giọng) + giả lập thiếu giọng (fallback); stroke order vẽ đúng; responsive phone + laptop.

## Todo
- [ ] use-speech hook (voices zh, fallback)
- [ ] audio-button + trạng thái thiếu giọng
- [ ] tone-colors + pinyin-text
- [ ] stroke-order-viewer (hanzi-writer)
- [ ] vocab-card responsive
- [ ] lesson-page + route + link sang review
- [ ] Test audio + fallback + stroke + responsive

## Success criteria
- Bài hiển thị đầy đủ; bấm 🔊 đọc đúng tiếng Trung (Chrome); thiếu giọng → fallback rõ; nét viết hanzi chạy; đẹp trên phone + laptop.

## Risks
- `getVoices()` rỗng lần đầu (async) → phải nghe `voiceschanged`. 
- iOS Safari: TTS cần user gesture → speak() chỉ gọi từ sự kiện click (đã thỏa vì là nút bấm).

## Next
→ Phase 04 (review drills + SRS).
