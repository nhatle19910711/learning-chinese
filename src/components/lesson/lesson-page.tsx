import { Link, useParams } from 'react-router-dom';
import { PageContainer } from '../layout/page-container';
import { getLessonById } from '../../content/content-index';
import { useProgress } from '../../progress/progress-context';
import { VocabCard } from './vocab-card';
import './lesson.css';

export function LessonPage() {
  const { id = '' } = useParams();
  const lesson = getLessonById(id);
  const { markLessonDone } = useProgress();

  if (!lesson) {
    return (
      <PageContainer>
        <p>Không tìm thấy bài học.</p>
        <Link to="/" className="btn">
          ← Về trang chủ
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="lesson-header">
        <Link to="/" className="lesson-back text-muted">
          ← Trang chủ
        </Link>
        <h1 className="lesson-title">{lesson.title}</h1>
        <p className="text-muted">{lesson.intro}</p>
        <p className="text-muted lesson-tip">
          💡 Bấm 🔊 để nghe, ✍️ để xem nét viết. Màu pinyin theo thanh điệu.
        </p>
      </div>

      <div className="vocab-grid">
        {lesson.vocab.map((item) => (
          <VocabCard key={item.hanzi} item={item} />
        ))}
      </div>

      <div className="lesson-footer">
        <Link
          to={`/review/${lesson.id}`}
          className="btn btn-primary btn-block"
          onClick={() => markLessonDone(lesson.id)}
        >
          Ôn tập bài này →
        </Link>
      </div>
    </PageContainer>
  );
}
