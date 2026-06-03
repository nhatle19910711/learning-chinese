import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../layout/page-container';
import { PasscodeGate } from '../ai/passcode-gate';
import { AiErrorBanner } from '../ai/ai-error-banner';
import { McqQuestionCard } from '../review/mcq-question-card';
import { AiError, postJson } from '../../lib/ai-client';
import { exercisesToMcq } from '../../lib/ai-exercise-adapter';
import { lessons } from '../../content/content-index';
import type { AiErrorCode, ExerciseResponse, VocabBrief } from '../../lib/ai-contracts';
import type { McqQuestion } from '../../lib/drill-engine';
import '../review/review.css';
import './exercise.css';

type View = 'setup' | 'run' | 'summary';

export function AiExercisePanel() {
  return (
    <PageContainer>
      <PasscodeGate>
        <ExerciseRunner />
      </PasscodeGate>
    </PageContainer>
  );
}

function ExerciseRunner() {
  const [lessonId, setLessonId] = useState(lessons.find((l) => l.level === 'HSK1')?.id ?? lessons[0].id);
  const [count, setCount] = useState(5);
  const [view, setView] = useState<View>('setup');
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<AiErrorCode | null>(null);

  const generate = async () => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson || loading) return;
    setLoading(true);
    setErrorCode(null);
    const vocab: VocabBrief[] = lesson.vocab.map((v) => ({ hanzi: v.hanzi, pinyin: v.pinyin, vi: v.vi }));
    try {
      const res = await postJson<ExerciseResponse>('/api/exercise', {
        vocab,
        topicTitle: lesson.title,
        count,
      });
      setQuestions(exercisesToMcq(res.exercises));
      setIndex(0);
      setCorrectCount(0);
      setView('run');
    } catch (e) {
      setErrorCode(e instanceof AiError ? e.code : 'server');
    } finally {
      setLoading(false);
    }
  };

  const onResult = (correct: boolean) => {
    if (correct) setCorrectCount((c) => c + 1);
    if (index + 1 >= questions.length) setView('summary');
    else setIndex(index + 1);
  };

  if (view === 'run') {
    return (
      <div className="exercise">
        <McqQuestionCard
          key={index}
          question={questions[index]}
          index={index}
          total={questions.length}
          onResult={onResult}
        />
      </div>
    );
  }

  if (view === 'summary') {
    return (
      <div className="exercise exercise__summary">
        <h1>Kết quả</h1>
        <p className="exercise__score">
          Đúng {correctCount}/{questions.length} câu
        </p>
        <div className="exercise__actions">
          <button type="button" className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? 'Đang tạo…' : '🎲 Tạo bộ mới'}
          </button>
          <button type="button" className="btn" onClick={() => setView('setup')}>
            Đổi bài học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise">
      <header className="exercise__head">
        <h1>🎯 Bài tập động</h1>
        <p className="text-muted">AI tạo bài tập trắc nghiệm từ từ vựng bài học bạn chọn.</p>
      </header>

      <label className="exercise__field">
        <span>Bài học</span>
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>

      <label className="exercise__field">
        <span>Số câu: {count}</span>
        <input
          type="range"
          min={3}
          max={10}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </label>

      <button type="button" className="btn btn-primary" onClick={generate} disabled={loading}>
        {loading ? 'Đang tạo…' : 'Tạo bài tập'}
      </button>

      <AiErrorBanner code={errorCode} onRetry={generate} />
      <Link to="/ai" className="text-muted exercise__back">
        ← Về trang AI
      </Link>
    </div>
  );
}
