# Học Tiếng Trung 🀄

Web học tiếng Trung (Mandarin) dành cho **người Việt mới bắt đầu**. Bài giảng + phát âm + bài ôn tập, lưu tiến độ ngay trên trình duyệt. Không cần tài khoản, không cần server.

## Tính năng (Phase 1 MVP)

- **Bài giảng**: Bài 0 Pinyin & 4 thanh điệu + 5 bài HSK1 (~90 từ vựng theo chủ đề: chào hỏi, số đếm, gia đình, thời gian, hoạt động hằng ngày).
- **Phát âm**: Web Speech API (TTS trình duyệt, giọng tiếng Trung). Tự động báo và hiển thị pinyin nếu thiết bị thiếu giọng.
- **Nét viết chữ Hán**: animation thứ tự nét (hanzi-writer).
- **4 kiểu ôn tập**: thẻ ghi nhớ, chọn nghĩa, nghe chọn chữ, nhận diện thanh điệu (+ ôn tổng hợp).
- **Lưu tiến độ**: localStorage; có sao lưu / khôi phục / xóa.
- **Dark mode** + **responsive** (điện thoại & laptop).

## Tính năng AI (Phase 2)

Tích hợp **Gemini (free tier)** qua một **Cloudflare Worker proxy** (giấu API key). 4 tính năng tại trang **✨ Luyện với AI** (`/ai`):

- **Gia sư chat** (`/tutor`): hỏi đáp ngữ pháp/pinyin/từ vựng, trả lời tiếng Việt, **streaming**.
- **Dịch Việt ↔ Trung** (`/practice/translate`): dịch hai chiều, kèm pinyin + ghi chú cách dùng.
- **Chấm & sửa câu** (`/practice/grade`): kiểm tra câu tiếng Trung hoặc chấm bản dịch Việt→Trung.
- **Bài tập động** (`/practice/generate`): AI sinh trắc nghiệm từ từ vựng bài học (tái dùng UI ôn tập).
- **Luyện hội thoại** (`/practice/conversation`): đóng vai tình huống, AI nói tiếng Trung kèm pinyin + nghĩa + TTS.

Truy cập AI cần **mật khẩu chia sẻ** (nhập 1 lần) để tránh đốt quota khi deploy public.

## Công nghệ

React + TypeScript + Vite. CSS thuần (design tokens). Backend tối giản: 1 Cloudflare Worker (`worker/`) proxy Gemini cho các route `/api/*`, phần còn lại phục vụ web tĩnh.

## Chạy local

```bash
npm install
npm run dev          # web tĩnh: http://localhost:5173 (KHÔNG có /api)

# Để chạy kèm tính năng AI (Worker + static):
cp .dev.vars.example .dev.vars   # rồi điền GEMINI_API_KEY + APP_PASSCODE
npm run build
npm run dev:worker   # http://localhost:8787 (cả SPA lẫn /api/*)
```

Lấy `GEMINI_API_KEY` tại https://aistudio.google.com/apikey. `APP_PASSCODE` tự đặt.

## Deploy (Cloudflare Workers — static + AI)

```bash
wrangler secret put GEMINI_API_KEY   # nhập key (mã hóa, không lộ)
wrangler secret put APP_PASSCODE     # mật khẩu chia sẻ
npm run deploy                       # build + wrangler deploy
```

Cấu hình tại `wrangler.jsonc` (`main` = `worker/index.ts`, `assets` phục vụ `dist/` + SPA fallback).
⚠️ Model Gemini là hằng số trong `worker/config.ts` (mặc định `gemini-2.5-flash`) — xác minh model free mới nhất trên AI Studio trước khi deploy.

## Thêm bài học mới

Tạo file JSON trong `src/content/lessons/` theo cấu trúc `src/content/content-types.ts`, rồi đăng ký trong `src/content/content-index.ts`.

## Lộ trình

- **Phase 1 (MVP):** bài giảng + phát âm + ôn tập + nét viết — xong. Xem `plans/260602-2135-chinese-learning-website-mvp/`.
- **Phase 2 (AI):** Gemini qua Cloudflare Worker proxy — xong. Xem `plans/260603-0938-ai-gemini-cloudflare-worker-phase-2/`.

**Sau Phase 2 (chưa làm):** account/đồng bộ đa thiết bị, lưu lịch sử chat lên server, chống bot nâng cao (Turnstile), rate-limit phân tán (KV/DO), voice input (STT).
