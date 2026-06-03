import { Link } from 'react-router-dom';
import { PageContainer } from '../layout/page-container';
import './ai-hub.css';

/** Mỗi mục = 1 tính năng AI. Bổ sung dần theo phase. */
const FEATURES = [
  { to: '/tutor', icon: '🧑‍🏫', title: 'Gia sư chat', desc: 'Hỏi đáp về ngữ pháp, pinyin, từ vựng — trả lời tiếng Việt.' },
  { to: '/practice/translate', icon: '🔄', title: 'Dịch Việt ↔ Trung', desc: 'Dịch câu/từ hai chiều, kèm pinyin và ghi chú.' },
  { to: '/practice/grade', icon: '✍️', title: 'Chấm & sửa câu', desc: 'Nhập câu tiếng Trung hoặc dịch Việt→Trung để AI sửa.' },
  { to: '/practice/generate', icon: '🎯', title: 'Bài tập động', desc: 'AI tạo bài tập trắc nghiệm từ từ vựng bài học.' },
  { to: '/practice/conversation', icon: '💬', title: 'Luyện hội thoại', desc: 'Đóng vai tình huống thực tế, nói chuyện bằng tiếng Trung.' },
];

export function AiHubPage() {
  return (
    <PageContainer>
      <section className="ai-hub">
        <header className="ai-hub__head">
          <h1>✨ Luyện với AI</h1>
          <p className="text-muted">
            Tính năng AI miễn phí (Gemini). Cần nhập mật khẩu chung một lần để mở khóa.
          </p>
        </header>
        <ul className="ai-hub__grid">
          {FEATURES.map((f) => (
            <li key={f.to}>
              <Link to={f.to} className="card ai-hub__item">
                <span className="ai-hub__icon">{f.icon}</span>
                <h2>{f.title}</h2>
                <p className="text-muted">{f.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
