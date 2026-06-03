import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/page-container';
import { lessons } from '../content/content-index';
import { useProgress } from '../progress/progress-context';
import { ProgressTools } from '../components/progress/progress-tools';
import './home-page.css';

export function HomePage() {
  const { getLessonProgress } = useProgress();

  return (
    <PageContainer>
      <section className="home-hero">
        <h1 className="home-hero__title">
          Học Tiếng Trung <span className="hanzi">中文</span>
        </h1>
        <p className="text-muted">
          Dành cho người Việt mới bắt đầu. Học pinyin, thanh điệu và từ vựng HSK1 — có phát âm và bài
          ôn tập giúp ghi nhớ.
        </p>
      </section>

      <ul className="lesson-list">
        {lessons.map((lesson) => {
          const p = getLessonProgress(lesson.id);
          const pct = p.total ? Math.round((p.known / p.total) * 100) : 0;
          return (
            <li key={lesson.id}>
              <Link to={`/lesson/${lesson.id}`} className="card lesson-list__item">
                <div className="lesson-list__head">
                  <span className={`badge badge--${lesson.level === 'pinyin' ? 'pinyin' : 'hsk'}`}>
                    {lesson.level === 'pinyin' ? 'Nền tảng' : 'HSK1'}
                  </span>
                  {p.done && <span className="badge badge--done">✓ Đã học</span>}
                </div>
                <h2 className="lesson-list__title">{lesson.title}</h2>
                <p className="lesson-list__meta text-muted">{lesson.vocab.length} từ</p>
                <div className="progress-bar" aria-label={`Tiến độ ${pct}%`}>
                  <span className="progress-bar__fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="lesson-list__meta text-muted">
                  {p.known}/{p.total} từ đã thuộc
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <ProgressTools />
    </PageContainer>
  );
}
