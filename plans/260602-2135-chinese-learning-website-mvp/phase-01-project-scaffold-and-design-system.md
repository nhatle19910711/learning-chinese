# Phase 01 — Project Scaffold & Design System

**Priority:** High · **Status:** pending · **Depends:** none

## Overview
Khởi tạo Vite+React+TS, routing, hệ thống CSS tokens (dark mode), font CJK, layout responsive shell (mobile + laptop).

## Key insights
- Quy mô 1-2 user → KHÔNG dùng UI lib nặng. CSS variables đủ cho theming + dark mode (KISS).
- Mobile-first: viết CSS cho điện thoại trước, media query mở rộng cho laptop.
- Font CJK bắt buộc để render hanzi + dấu thanh pinyin (ā á ǎ à) chuẩn.

## Requirements
- React + TypeScript + Vite, build chạy không lỗi.
- Routing: `/` (home/danh sách bài), `/lesson/:id`, `/review/:id` (hoặc `/review`).
- Dark/light theme toggle, lưu lựa chọn localStorage, tôn trọng `prefers-color-scheme` lần đầu.
- Responsive: dùng tốt ở ≤390px (phone) và ≥1024px (laptop).

## Architecture
```
src/
├── main.tsx                      # entry + router
├── app.tsx                       # layout shell (header, theme toggle, <Outlet/>)
├── styles/
│   ├── tokens.css                # CSS variables: màu, spacing, font, radius (light+dark)
│   └── global.css                # reset, base, responsive helpers
├── theme/
│   └── theme-context.tsx         # ThemeProvider + useTheme (light/dark, localStorage)
├── components/
│   └── layout/
│       ├── app-header.tsx        # logo + nav + theme toggle
│       └── page-container.tsx    # max-width container, padding responsive
└── routes/
    └── home-page.tsx             # placeholder danh sách bài (điền ở phase 02-03)
```
- Font CJK: thêm `<link>` Noto Sans SC trong `index.html`; fallback `system-ui`.

## Related files
- Create: tất cả file trên + `index.html` (font link), `vite.config.ts`, `tsconfig.json` (Vite template), `package.json`.
- Modify: none.

## Implementation steps
1. `npm create vite@latest . -- --template react-ts` (trong thư mục dự án) → cài deps.
2. Thêm `react-router-dom`. Cấu hình router trong `main.tsx` với layout `app.tsx`.
3. Viết `tokens.css`: biến cho `--color-bg`, `--color-fg`, `--color-primary`, `--color-card`, spacing scale, `--font-cjk`. Định nghĩa block `[data-theme="dark"]` override.
4. `theme-context.tsx`: đọc localStorage (`theme`) hoặc `prefers-color-scheme`; set `data-theme` lên `<html>`; expose `toggleTheme`.
5. `app-header.tsx`: tên web (tiếng Việt) + nút toggle dark mode + link Trang chủ.
6. `page-container.tsx`: container responsive (`width:100%; max-width:960px; margin:auto; padding`).
7. `home-page.tsx`: placeholder "Danh sách bài học" (sẽ nối data ở phase sau).
8. Thêm font Noto Sans SC vào `index.html`, set `--font-cjk` cho element chứa hanzi.
9. Chạy `npm run build` + `npm run dev` xác nhận không lỗi, test responsive (DevTools mobile + desktop).

## Todo
- [ ] Init Vite React-TS + cài deps
- [ ] react-router-dom + router/layout
- [ ] tokens.css + global.css (light + dark)
- [ ] theme-context + toggle, lưu localStorage
- [ ] app-header + page-container responsive
- [ ] home-page placeholder
- [ ] Font Noto Sans SC
- [ ] build + dev OK, test phone & laptop

## Success criteria
- `npm run build` không lỗi; app chạy; theme toggle hoạt động và nhớ lựa chọn; layout ổn ở phone + laptop; hanzi mẫu render đúng font.

## Risks
- Dấu thanh pinyin lỗi font → đảm bảo font CJK + UTF-8. Mitigation: test chuỗi "nǐ hǎo 你好" sớm.

## Next
→ Phase 02 (content data model).
