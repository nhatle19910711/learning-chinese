---
status: completed
created: 2026-06-02
completed: 2026-06-02
scope: Phase 1 MVP only (no AI)
scale: 1-2 learners (personal, not public)
---

# Plan: Web Học Tiếng Trung (Mandarin) cho người Việt — Phase 1 MVP

Static React/Vite SPA dạy Mandarin cho người Việt mới bắt đầu. Bài giảng + âm thanh (Web Speech API) + bài ôn tập + nét viết hanzi. Lưu tiến độ localStorage. Deploy Cloudflare Pages. Quy mô 1-2 người → tối giản, không backend, không scaling.

## Context
- Brainstorm: [brainstorm report](../reports/brainstorm-260602-2135-chinese-learning-website.md)
- Decisions chốt: React+Vite+TS · UI tiếng Việt · Web Speech API TTS (zh-CN) · localStorage · nội dung JSON · Dark mode · hanzi-writer stroke order · **responsive (mobile + laptop)** · deploy Cloudflare Pages.
- Nội dung MVP: Bài 0 Pinyin/4 thanh điệu + 5 bài HSK1 (~150 từ).
- AI (chat tutor, tạo bài tập, hội thoại, chấm câu) = **Phase 2 tương lai**, KHÔNG trong plan này.

## Tech stack
- Vite + React + TypeScript, react-router-dom.
- Styling: plain CSS + CSS variables (design tokens) → dark mode dễ; mobile-first responsive (media queries). KHÔNG dùng UI lib nặng (YAGNI).
- Font CJK: Noto Sans SC (CDN). Audio: Web Speech API (`speechSynthesis`). Stroke order: `hanzi-writer` (npm).
- State: React Context cho theme + progress. KHÔNG redux.

## Phases

| # | Phase | Status | Mô tả |
|---|-------|--------|-------|
| 01 | [Scaffold & Design System](phase-01-project-scaffold-and-design-system.md) | completed | Vite+React+TS, routing, CSS tokens, dark mode, font CJK, layout responsive |
| 02 | [Content Data Model & Lessons](phase-02-content-data-model-and-lessons.md) | completed | JSON schema + nội dung Pinyin + 5 bài HSK1, content loader |
| 03 | [Lesson View, Audio & Stroke Order](phase-03-lesson-view-audio-stroke-order.md) | completed | Lesson page, vocab card, useSpeech hook + fallback, hanzi-writer |
| 04 | [Review Drills & Lite SRS](phase-04-review-drills-and-srs.md) | completed | 4 loại drill + đánh dấu thuộc/cần ôn |
| 05 | [Progress Persistence & Deploy](phase-05-progress-persistence-and-deploy.md) | completed | localStorage progress, responsive QA, deploy config (Cloudflare Pages) |

**Build:** `npm run build` passing (68 modules, ~87KB gzip JS). Deploy config sẵn sàng; chưa deploy thực tế (cần tài khoản Cloudflare).

## Dependencies
- 01 → 02 → 03 → 04 → 05 (tuần tự; 02 có thể song song một phần với 01).
- Phase 03, 04 phụ thuộc content schema ở 02.

## Out of scope (Phase 2 — future)
- AI Gemini qua Cloudflare Worker proxy: chat gia sư, tạo bài tập động, luyện hội thoại, chấm/sửa câu.
- Account/đồng bộ đa thiết bị, MP3 thu sẵn.

## Success criteria
- Chạy trên điện thoại + laptop (responsive), dark mode hoạt động.
- Hoàn thành Bài 0 + 5 bài HSK1 với audio phát đúng (macOS/Chrome), fallback khi thiếu giọng zh-CN.
- 4 loại bài ôn tập chạy mượt; tiến độ lưu & khôi phục sau reload.
- Deploy được lên Cloudflare Pages.
