import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageContainer } from '../layout/page-container';
import { getLessonById } from '../../content/content-index';
import { useProgress } from '../../progress/progress-context';
import { generateMcqSession, type DrillMode, type McqQuestion } from '../../lib/drill-engine';
import { nextStatus, pickReviewOrder } from '../../lib/srs-lite';
import { useSpeech } from '../../hooks/use-speech';
import type { VocabItem } from '../../content/content-types';
import { DrillFlashcard } from './drill-flashcard';
import { McqQuestionCard } from './mcq-question-card';
import { ReviewSummary, type DrillResult } from './review-summary';
import './review.css';

type SessionMode = 'flashcard' | DrillMode | 'mixed';
type View = 'select' | 'run' | 'summary';

const MODE_OPTIONS: { mode: SessionMode; label: string; desc: string }[] = [
  { mode: 'flashcard', label: '🃏 Thẻ ghi nhớ', desc: 'Lật thẻ, tự đánh giá thuộc/chưa' },
  { mode: 'meaning', label: '📖 Chọn nghĩa', desc: 'Nhìn chữ Hán, chọn nghĩa tiếng Việt' },
  { mode: 'listen', label: '👂 Nghe chọn chữ', desc: 'Nghe phát âm, chọn chữ đúng' },
  { mode: 'tone', label: '🎵 Thanh điệu', desc: 'Nhận diện thanh điệu của từ' },
  { mode: 'mixed', label: '🎲 Ôn tổng hợp', desc: 'Trộn cả 3 dạng trắc nghiệm' },
];

const MCQ_COUNT = 10;

export function ReviewPage() {
  const { id = '' } = useParams();
  const lesson = getLessonById(id);
  const { setWordStatus, getWordStatus, wordStatusMap } = useProgress();
  const { isSupported: canListen } = useSpeech();

  const [view, setView] = useState<View>('select');
  const [mode, setMode] = useState<SessionMode>('flashcard');
  const [flashItems, setFlashItems] = useState<VocabItem[]>([]);
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<DrillResult[]>([]);

  if (!lesson) {
    return (
      <PageContainer>
        <p>Không tìm thấy bài học.</p>
        <Link to="/" className="btn">
          ← Trang chủ
        </Link>
      </PageContainer>
    );
  }

  const start = (selectedMode: SessionMode, pool: VocabItem[] = lesson.vocab) => {
    setMode(selectedMode);
    setIndex(0);
    setResults([]);
    if (selectedMode === 'flashcard') {
      setFlashItems(pickReviewOrder(lesson.id, pool, wordStatusMap));
      setQuestions([]);
    } else {
      setQuestions(generateMcqSession(pool, selectedMode, Math.min(MCQ_COUNT, pool.length), canListen));
      setFlashItems([]);
    }
    setView('run');
  };

  const total = mode === 'flashcard' ? flashItems.length : questions.length;

  const handleResult = (vocab: VocabItem, correct: boolean) => {
    setWordStatus(lesson.id, vocab.hanzi, nextStatus(getWordStatus(lesson.id, vocab.hanzi), correct));
    const updated = [...results, { vocab, correct }];
    setResults(updated);
    if (index + 1 >= total) setView('summary');
    else setIndex(index + 1);
  };

  const retryWrong = () => {
    const wrong = results.filter((r) => !r.correct).map((r) => r.vocab);
    if (wrong.length) start(mode, wrong);
  };

  return (
    <PageContainer>
      <div className="review-header">
        <Link to={`/lesson/${lesson.id}`} className="text-muted review-back">
          ← {lesson.title}
        </Link>
      </div>

      {view === 'select' && (
        <div className="mode-select">
          <h1 className="review-title">Chọn kiểu ôn tập</h1>
          <div className="mode-grid">
            {MODE_OPTIONS.map((opt) => {
              const needsVoice = opt.mode === 'listen';
              const disabled = needsVoice && !canListen;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  className="card mode-card"
                  onClick={() => start(opt.mode)}
                  disabled={disabled}
                  title={disabled ? 'Thiết bị chưa có giọng tiếng Trung' : undefined}
                >
                  <span className="mode-card__label">{opt.label}</span>
                  <span className="text-muted mode-card__desc">
                    {disabled ? 'Cần giọng tiếng Trung trên thiết bị' : opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === 'run' &&
        (mode === 'flashcard' ? (
          <DrillFlashcard
            key={index}
            item={flashItems[index]}
            index={index}
            total={total}
            onResult={(c) => handleResult(flashItems[index], c)}
          />
        ) : (
          <McqQuestionCard
            key={index}
            question={questions[index]}
            index={index}
            total={total}
            onResult={(c) => handleResult(questions[index].vocab, c)}
          />
        ))}

      {view === 'summary' && (
        <ReviewSummary
          results={results}
          lessonId={lesson.id}
          onReplay={() => start(mode)}
          onRetryWrong={retryWrong}
        />
      )}
    </PageContainer>
  );
}
