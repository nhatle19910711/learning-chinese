import { Link } from 'react-router-dom';
import type { VocabItem } from '../../content/content-types';
import { AudioButton } from '../lesson/audio-button';

export interface DrillResult {
  vocab: VocabItem;
  correct: boolean;
}

interface ReviewSummaryProps {
  results: DrillResult[];
  lessonId: string;
  onReplay: () => void;
  onRetryWrong: () => void;
}

export function ReviewSummary({ results, lessonId, onReplay, onRetryWrong }: ReviewSummaryProps) {
  const correctCount = results.filter((r) => r.correct).length;
  const total = results.length;
  const wrong = results.filter((r) => !r.correct);
  const pct = total ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="summary">
      <h2 className="summary__title">Kết quả ôn tập</h2>
      <div className="summary__score">
        <span className="summary__pct">{pct}%</span>
        <span className="text-muted">
          Đúng {correctCount}/{total}
        </span>
      </div>

      {wrong.length > 0 ? (
        <div className="summary__wrong">
          <h3>Các từ cần ôn lại</h3>
          <ul className="summary__list">
            {wrong.map((r) => (
              <li key={r.vocab.hanzi} className="summary__item">
                <span className="hanzi summary__item-hanzi">{r.vocab.hanzi}</span>
                <span className="text-muted">
                  {r.vocab.pinyin} — {r.vocab.vi}
                </span>
                <AudioButton text={r.vocab.hanzi} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="summary__perfect">🎉 Tuyệt vời! Bạn trả lời đúng tất cả.</p>
      )}

      <div className="summary__actions">
        {wrong.length > 0 && (
          <button type="button" className="btn" onClick={onRetryWrong}>
            Ôn lại từ sai
          </button>
        )}
        <button type="button" className="btn" onClick={onReplay}>
          Ôn lại từ đầu
        </button>
        <Link to={`/lesson/${lessonId}`} className="btn">
          Về bài học
        </Link>
        <Link to="/" className="btn btn-primary">
          Trang chủ
        </Link>
      </div>
    </div>
  );
}
