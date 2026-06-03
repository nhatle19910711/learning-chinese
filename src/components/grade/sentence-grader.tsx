import { useState } from 'react';
import { PageContainer } from '../layout/page-container';
import { PasscodeGate } from '../ai/passcode-gate';
import { AiErrorBanner } from '../ai/ai-error-banner';
import { AiError, postJson } from '../../lib/ai-client';
import type { AiErrorCode, GradeMode, GradeResult } from '../../lib/ai-contracts';
import { GradeResultView } from './grade-result-view';
import './grade.css';

export function SentenceGrader() {
  return (
    <PageContainer>
      <PasscodeGate>
        <Grader />
      </PasscodeGate>
    </PageContainer>
  );
}

function Grader() {
  const [mode, setMode] = useState<GradeMode>('check');
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<AiErrorCode | null>(null);

  // Mode dịch cần câu tiếng Việt gốc.
  const canSubmit = text.trim() !== '' && (mode === 'check' || prompt.trim() !== '');

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setErrorCode(null);
    setResult(null);
    try {
      const r = await postJson<GradeResult>('/api/grade', { mode, text: text.trim(), prompt: prompt.trim() });
      setResult(r);
    } catch (e) {
      setErrorCode(e instanceof AiError ? e.code : 'server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grader">
      <header className="grader__head">
        <h1>✍️ Chấm &amp; sửa câu</h1>
        <p className="text-muted">Nhập câu tiếng Trung để AI kiểm tra, hoặc dịch một câu tiếng Việt rồi chấm.</p>
      </header>

      <div className="grader__modes">
        <button
          type="button"
          className={mode === 'check' ? 'is-active' : ''}
          onClick={() => setMode('check')}
        >
          Kiểm tra câu Trung
        </button>
        <button
          type="button"
          className={mode === 'translate' ? 'is-active' : ''}
          onClick={() => setMode('translate')}
        >
          Dịch Việt → Trung
        </button>
      </div>

      {mode === 'translate' && (
        <label className="grader__field">
          <span>Câu tiếng Việt gốc</span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Tôi tên là Nam."
          />
        </label>
      )}

      <label className="grader__field">
        <span>{mode === 'translate' ? 'Bản dịch tiếng Trung của bạn' : 'Câu tiếng Trung'}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="我叫南。"
          rows={2}
          maxLength={200}
        />
      </label>

      <button type="button" className="grader__submit" onClick={submit} disabled={!canSubmit || loading}>
        {loading ? 'Đang chấm…' : 'Chấm câu'}
      </button>

      <AiErrorBanner code={errorCode} onRetry={submit} />
      {result && <GradeResultView result={result} />}
    </div>
  );
}
