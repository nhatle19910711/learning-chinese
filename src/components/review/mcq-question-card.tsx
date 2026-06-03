import { useEffect, useState } from 'react';
import type { McqQuestion } from '../../lib/drill-engine';
import { useSpeech } from '../../hooks/use-speech';
import { AudioButton } from '../lesson/audio-button';

interface McqQuestionCardProps {
  question: McqQuestion;
  index: number;
  total: number;
  onResult: (correct: boolean) => void;
}

/** Câu hỏi trắc nghiệm dùng chung cho 3 loại: nghĩa, nghe-chọn-chữ, thanh điệu. */
export function McqQuestionCard({ question, index, total, onResult }: McqQuestionCardProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const { speak, isSupported } = useSpeech();
  const answered = picked !== null;

  // Tự đọc khi là dạng nghe (nếu thiết bị hỗ trợ). Phụ thuộc isSupported vì
  // giọng tải bất đồng bộ — đảm bảo đọc lại khi giọng sẵn sàng sau khi mount.
  useEffect(() => {
    setPicked(null);
    if (question.speakPrompt && isSupported) speak(question.promptHanzi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, isSupported]);

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
  };

  const optionClass = (i: number): string => {
    if (!answered) return 'mcq-option';
    if (i === question.answerIndex) return 'mcq-option mcq-option--correct';
    if (i === picked) return 'mcq-option mcq-option--wrong';
    return 'mcq-option mcq-option--muted';
  };

  return (
    <div className="drill">
      <p className="drill__counter text-muted">
        Câu {index + 1}/{total}
      </p>
      <p className="mcq-question">{question.questionText}</p>

      <div className="mcq-prompt">
        {question.speakPrompt ? (
          <AudioButton text={question.promptHanzi} label="Nghe lại" />
        ) : (
          <span className="hanzi mcq-prompt__hanzi">{question.promptHanzi}</span>
        )}
      </div>

      <div className="mcq-options">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={optionClass(i)}
            onClick={() => choose(i)}
            disabled={answered}
          >
            <span className={question.mode === 'listen' ? 'hanzi' : ''}>{opt}</span>
          </button>
        ))}
      </div>

      {answered && (
        <button
          type="button"
          className="btn btn-primary btn-block drill__next"
          onClick={() => onResult(picked === question.answerIndex)}
        >
          Câu tiếp →
        </button>
      )}
    </div>
  );
}
