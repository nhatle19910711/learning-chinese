# Phase 05 — Progress Persistence & Deploy

**Priority:** High · **Status:** pending · **Depends:** Phase 01–04

## Overview
Lưu tiến độ qua localStorage (trạng thái từ vựng, bài đã học, theme), responsive QA cuối (phone + laptop), deploy Cloudflare Pages.

## Key insights
- 1-2 user → localStorage đủ. Bọc trong service + Context để tránh rải `localStorage.*` khắp nơi (DRY).
- Thêm export/import JSON tiến độ (nhẹ) phòng mất khi xóa cache — optional nhưng rẻ.
- Cloudflare Pages: build `npm run build`, output `dist/`. SPA cần redirect về `index.html`.

## Requirements
- Persist: trạng thái SRS mỗi từ, bài đã hoàn thành, theme (đã có ở P01).
- Khôi phục đúng sau reload.
- Home hiện tiến độ mỗi bài (vd: 12/30 từ thuộc).
- Deploy thành công, chạy trên phone + laptop.

## Architecture
```
src/
├── lib/
│   └── progress-store.ts         # đọc/ghi localStorage, version key, export/import
├── progress/
│   └── progress-context.tsx      # ProgressProvider + useProgress (state + actions)
public/
└── _redirects                    # "/*  /index.html  200"  (SPA fallback CF Pages)
```

### Progress shape
```ts
interface ProgressState {
  version: 1;
  wordStatus: Record<string /*hanzi|wordId*/, 'new'|'learning'|'known'>;
  lessonsDone: string[];        // lesson ids hoàn thành
}
```

## Related files
- Create: `progress-store.ts`, `progress-context.tsx`, `public/_redirects`.
- Modify: `main.tsx` (bọc ProgressProvider), review-page (ghi trạng thái), home-page (hiện tiến độ).

## Implementation steps
1. `progress-store.ts`: `load()/save()` key `lc-progress-v1`; guard JSON parse lỗi → default; `exportJson()/importJson()`.
2. `progress-context.tsx`: state từ store; actions `setWordStatus`, `markLessonDone`, `resetProgress`, `getLessonProgress(lessonId)`; auto-save khi đổi.
3. Bọc `<ProgressProvider>` ở `main.tsx`.
4. Nối review-page (P04): sau phiên, gọi `setWordStatus` cho từng từ.
5. home-page: mỗi card hiện `x/y từ thuộc` + đánh dấu bài đã xong.
6. (Optional) UI export/import tiến độ trong header/settings.
7. `public/_redirects` cho SPA fallback.
8. **Responsive QA cuối**: kiểm mọi trang ở phone (≤390px) + laptop (≥1024px): home, lesson, 4 drill, summary, dark mode.
9. Deploy Cloudflare Pages: connect repo / `wrangler pages deploy dist` (build cmd `npm run build`, output `dist`). Xác nhận live trên điện thoại + laptop.

## Todo
- [ ] progress-store (localStorage + export/import)
- [ ] progress-context + actions
- [ ] Bọc provider, nối review ghi trạng thái
- [ ] home hiện tiến độ
- [ ] (optional) UI export/import
- [ ] _redirects SPA
- [ ] Responsive QA phone + laptop (mọi trang + dark mode)
- [ ] Deploy Cloudflare Pages + verify live

## Success criteria
- Tiến độ lưu & khôi phục đúng sau reload; home hiện tiến độ; toàn site responsive phone + laptop; dark mode ok; deploy live thành công.

## Risks
- localStorage đầy/blocked (private mode) → try/catch, degrade gracefully (vẫn học được, không lưu).
- SPA route 404 khi refresh trên CF Pages → `_redirects` xử lý.

## Next
→ MVP hoàn tất. Phase 2 (AI Gemini qua Cloudflare Worker) — plan riêng sau.
