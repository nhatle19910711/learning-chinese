# Học Tiếng Trung 🀄

Web học tiếng Trung (Mandarin) dành cho **người Việt mới bắt đầu**. Bài giảng + phát âm + bài ôn tập, lưu tiến độ ngay trên trình duyệt. Không cần tài khoản, không cần server.

## Tính năng (Phase 1 MVP)

- **Bài giảng**: Bài 0 Pinyin & 4 thanh điệu + 5 bài HSK1 (~90 từ vựng theo chủ đề: chào hỏi, số đếm, gia đình, thời gian, hoạt động hằng ngày).
- **Phát âm**: Web Speech API (TTS trình duyệt, giọng tiếng Trung). Tự động báo và hiển thị pinyin nếu thiết bị thiếu giọng.
- **Nét viết chữ Hán**: animation thứ tự nét (hanzi-writer).
- **4 kiểu ôn tập**: thẻ ghi nhớ, chọn nghĩa, nghe chọn chữ, nhận diện thanh điệu (+ ôn tổng hợp).
- **Lưu tiến độ**: localStorage; có sao lưu / khôi phục / xóa.
- **Dark mode** + **responsive** (điện thoại & laptop).

## Công nghệ

React + TypeScript + Vite. CSS thuần (design tokens). Không backend.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build ra dist/
npm run preview    # xem thử bản build
```

## Deploy (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback đã cấu hình tại `public/_redirects`.

Hoặc deploy nhanh: `npx wrangler pages deploy dist`.

## Thêm bài học mới

Tạo file JSON trong `src/content/lessons/` theo cấu trúc `src/content/content-types.ts`, rồi đăng ký trong `src/content/content-index.ts`.

## Lộ trình tương lai (Phase 2 — chưa làm)

Tích hợp AI miễn phí (Gemini) qua Cloudflare Worker proxy: gia sư chat, tạo bài tập động, luyện hội thoại, chấm & sửa câu. Xem `plans/260602-2135-chinese-learning-website-mvp/`.
