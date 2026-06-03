# Brainstorm: Web Học Tiếng Trung Cho Người Mới (Vietnamese → Mandarin)

**Date:** 2026-06-02 · **Type:** Brainstorm summary · **Status:** Agreed, ready for `/plan`

---

## 1. Problem Statement & Requirements

Xây website học tiếng Trung (Mandarin) cho **người Việt mới bắt đầu**, có:
- Bài giảng (lessons) có cấu trúc theo lộ trình.
- Âm thanh phát âm (pronunciation audio).
- Bài ôn tập (review/practice) để thực hành & ghi nhớ.
- (Phase 2) AI miễn phí: gia sư chat, tạo bài tập động, luyện hội thoại, chấm/sửa câu.

**Quyết định đã chốt (qua hỏi-đáp):**

| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Đối tượng | Người Việt học Mandarin | UI + giải thích tiếng Việt; dạy hanzi + pinyin |
| Âm thanh | Web Speech API (TTS trình duyệt) | Miễn phí, không file audio; chấp nhận trade-off chất lượng giọng |
| Lưu tiến độ | localStorage (không account) | Không database, deploy tĩnh |
| Lộ trình | Pinyin/4 thanh điệu → HSK1 (~150 từ) | Nội dung mẫu do AI tạo |
| Tech stack | React + Vite | Component state hợp cho ôn tập + AI chat |
| AI | Cả 4 (chat/bài tập/hội thoại/chấm câu) | **Phase 2**, sau MVP |

---

## 2. Evaluated Approaches & Trade-offs

### 2.1 Audio — Web Speech API vs MP3 (CHỐT: Web Speech API)
- **Web Speech API**: ✅ free, zero file, chạy ngay. ⚠️ **Giọng zh-CN phụ thuộc OS/thiết bị** — macOS/Chrome có "Ting-Ting" tốt; vài Android/Linux không có giọng Trung → không phát được.
  - **Mitigation:** detect `speechSynthesis.getVoices()` lọc `lang=zh-CN`; nếu thiếu → hiện thông báo nhẹ + vẫn show pinyin; tốc độ đọc chỉnh chậm (`rate ~0.8`) cho người mới.
- MP3 thu sẵn: chất lượng cao nhưng tốn công/dung lượng → để dành nếu v1 không đủ tốt.

### 2.2 Persistence — localStorage vs backend (CHỐT: localStorage)
- localStorage: ✅ không server, không chi phí, deploy tĩnh (GitHub Pages/Netlify/Cloudflare Pages free). ⚠️ tiến độ chỉ trên 1 trình duyệt — chấp nhận được cho mục tiêu cá nhân.

### 2.3 Tech stack — Vanilla vs React/Vite (CHỐT: React/Vite)
- Ban đầu nghiêng vanilla (KISS), nhưng vì có **AI chat + bài tập động (Phase 2)** → React/Vite hợp lý hơn (state, component tái dùng). Không còn over-engineering khi đã có AI.

### 2.4 AI miễn phí (CHỐT: Gemini API, Phase 2)
| Option | Free | Backend | CN/VN quality | Verdict |
|---|---|---|---|---|
| **Google Gemini (3/2.5 Flash)** | ✅ ~1500 req/ngày, 10–15 RPM | ⚠️ cần proxy giấu key | ⭐⭐⭐⭐ | **Chọn** |
| WebLLM / transformers.js (in-browser) | ✅ no key | ❌ none | ⭐⭐ yếu CN | Over-engineering, tải GB |
| OpenRouter free / HF Inference | ✅ hạn chế | ⚠️ proxy | ⭐⭐–⭐⭐⭐ | Dự phòng |

- **Bảo mật key:** KHÔNG gọi Gemini trực tiếp từ browser (lộ API key). Dùng **serverless proxy stateless** (Cloudflare Worker / Vercel Function — free) giữ key. → "No backend" = "no database + 1 stateless free function".

---

## 3. Recommended Solution (Final)

**Kiến trúc:** Static React/Vite SPA + JSON content + Web Speech API + localStorage. Phase 2 thêm 1 serverless proxy gọi Gemini.

```
┌─────────────────────────────────────────────┐
│  Browser (React/Vite static SPA)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Lessons  │ │ Review   │ │ Progress     │ │
│  │ (JSON)   │ │ (drills) │ │ (localStorage)│ │
│  └────┬─────┘ └────┬─────┘ └──────────────┘ │
│       │  Web Speech API (TTS zh-CN)          │
│       └──────────────┬──────────────────────┘ │
│              (Phase 2) fetch                  │
└──────────────────────┼────────────────────────┘
                        ▼
        Serverless proxy (CF Worker, free) ──▶ Gemini API
```

### Content roadmap (MVP)
- **Bài 0 — Pinyin & 4 thanh điệu** (nền tảng; người Việt có lợi thế ngôn ngữ có thanh nhưng cách viết pinyin khác).
- **Bài 1–5** theo chủ đề HSK1: chào hỏi (你好/谢谢), số đếm, gia đình, thời gian, ~150 từ HSK1.
- Mỗi từ vựng: `hanzi + pinyin + nghĩa tiếng Việt + nút phát âm`.

### Loại bài ôn tập (review)
1. Flashcard (hanzi ↔ nghĩa).
2. Trắc nghiệm (hanzi→nghĩa, audio→hanzi).
3. Nghe chọn chữ (Web Speech đọc → chọn hanzi).
4. Nhận diện thanh điệu (tone drill).
5. (Lite SRS) đánh dấu từ "đã thuộc/cần ôn", lưu localStorage.

### Data model (content as JSON — dễ thêm bài sau)
```jsonc
// lessons/hsk1-greetings.json
{
  "id": "hsk1-greetings",
  "title": "Chào hỏi",
  "level": "HSK1",
  "vocab": [
    { "hanzi": "你好", "pinyin": "nǐ hǎo", "vi": "xin chào", "tones": [3,3] }
  ]
}
```

---

## 4. Implementation Phases

**Phase 1 — MVP (core, không AI):**
- Scaffold React/Vite + routing + theme tiếng Việt.
- Content JSON (Bài 0 + HSK1) — AI tạo nội dung mẫu.
- Component: lesson view, vocab card, audio button (Web Speech wrapper + voice detection).
- 4 loại review drill + lite SRS.
- Progress qua localStorage.
- Deploy tĩnh (Cloudflare Pages/Netlify).

**Phase 2 — AI (Gemini free):**
- Serverless proxy giữ key + rate-limit guard.
- AI chat tutor (giải thích tiếng Việt).
- Tạo bài tập động từ vocab đã học.
- Role-play hội thoại tình huống.
- Chấm/sửa câu tiếng Trung + giải thích lỗi.

---

## 5. Risks & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Thiếu giọng zh-CN trên thiết bị | Mất audio | Detect voices → fallback notice + pinyin; cân nhắc MP3 cho bài cốt lõi |
| Pinyin tone marks/hiển thị hanzi | UX | Font hỗ trợ CJK (Noto Sans SC), test render dấu thanh |
| Gemini free rate limit (1500/ngày) | AI gián đoạn nếu public | OK cho cá nhân; nếu public → cache câu trả lời, hàng đợi, hoặc nâng tier |
| Lộ API key | Lạm dụng quota | Bắt buộc serverless proxy, không để key ở client |
| Chất lượng nội dung học | Sai → học sai | Review nội dung AI tạo; bám chuẩn HSK1; người dùng góp ý |
| localStorage mất khi xóa cache | Mất tiến độ | Nút export/import JSON tiến độ (nhẹ, optional) |

---

## 6. Success Metrics
- Người mới hoàn thành Bài 0 (pinyin/thanh điệu) + ≥1 bài HSK1 không bí về thao tác.
- Audio phát đúng trên macOS/Chrome (môi trường chính); fallback rõ ràng nơi thiếu giọng.
- Review drill chạy mượt, tiến độ lưu & khôi phục đúng sau reload.
- Phase 2: AI chat trả lời tiếng Việt chính xác, độ trễ chấp nhận được, không lộ key.

---

## 7. Next Steps & Dependencies
- Chạy `/plan` để tạo kế hoạch chi tiết theo phase (Phase 1 MVP trước).
- Cần xác nhận: nền tảng deploy (Cloudflare Pages vs Netlify vs GitHub Pages).
- Phase 2 cần: tài khoản Google AI Studio để lấy Gemini API key (free).

---

## 8. Unresolved Questions
1. Deploy ở đâu? (Cloudflare Pages đề xuất — cùng hệ với Worker proxy ở Phase 2.)
2. Số lượng bài HSK1 cho MVP — đủ 5 chủ đề hay tối thiểu 2–3 để ra mắt sớm?
3. Có cần chế độ tối (dark mode) / responsive mobile ngay từ MVP không?
4. Web có cần hiển thị nét viết hanzi (stroke order) không? (Tăng giá trị nhưng thêm scope — có thư viện như hanzi-writer free.)
