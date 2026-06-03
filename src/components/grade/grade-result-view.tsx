import { useSpeech } from '../../hooks/use-speech';
import type { GradeResult } from '../../lib/ai-contracts';

interface Props {
  result: GradeResult;
}

export function GradeResultView({ result }: Props) {
  const { speak, isSupported } = useSpeech();

  return (
    <div className="grade-result">
      <div className={`grade-result__badge grade-result__badge--${result.correct ? 'ok' : 'fix'}`}>
        {result.correct ? '✓ Câu đã đúng' : '✎ Có thể cải thiện'}
      </div>

      <div className="grade-result__corrected">
        <span className="grade-result__label">Câu đúng:</span>
        <p className="grade-result__hanzi">
          {result.corrected}
          {isSupported && (
            <button type="button" onClick={() => speak(result.corrected)} title="Nghe">
              🔊
            </button>
          )}
        </p>
        <p className="grade-result__pinyin">{result.correctedPinyin}</p>
      </div>

      {result.issues.length > 0 && (
        <div className="grade-result__issues">
          <span className="grade-result__label">Lỗi & cách sửa:</span>
          <ul>
            {result.issues.map((issue, i) => (
              <li key={i}>
                <span className="grade-result__wrong">{issue.original}</span>
                {' → '}
                <span className="grade-result__right">{issue.correction}</span>
                <span className="grade-result__exp"> — {issue.explanationVi}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.suggestionVi && (
        <p className="grade-result__suggestion">💡 {result.suggestionVi}</p>
      )}
    </div>
  );
}
