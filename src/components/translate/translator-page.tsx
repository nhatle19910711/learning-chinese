import { useState } from 'react';
import { PageContainer } from '../layout/page-container';
import { PasscodeGate } from '../ai/passcode-gate';
import { AiErrorBanner } from '../ai/ai-error-banner';
import { useSpeech } from '../../hooks/use-speech';
import { AiError, postJson } from '../../lib/ai-client';
import type { AiErrorCode, TranslateDirection, TranslateResult } from '../../lib/ai-contracts';
import './translate.css';

export function TranslatorPage() {
  return (
    <PageContainer>
      <PasscodeGate>
        <Translator />
      </PasscodeGate>
    </PageContainer>
  );
}

function Translator() {
  const [direction, setDirection] = useState<TranslateDirection>('vi2zh');
  const [text, setText] = useState('');
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<AiErrorCode | null>(null);
  const { speak, isSupported } = useSpeech();

  const isVi2Zh = direction === 'vi2zh';

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setErrorCode(null);
    setResult(null);
    try {
      const r = await postJson<TranslateResult>('/api/translate', { direction, text: text.trim() });
      setResult(r);
    } catch (e) {
      setErrorCode(e instanceof AiError ? e.code : 'server');
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    setDirection((d) => (d === 'vi2zh' ? 'zh2vi' : 'vi2zh'));
    setResult(null);
    setText('');
  };

  return (
    <div className="translate">
      <header className="translate__head">
        <h1>🔄 Dịch Việt ↔ Trung</h1>
        <p className="text-muted">Dịch câu/từ hai chiều, kèm pinyin và ghi chú cách dùng.</p>
      </header>

      <div className="translate__dir">
        <span>{isVi2Zh ? 'Tiếng Việt' : 'Tiếng Trung'}</span>
        <button type="button" className="translate__swap" onClick={swap} title="Đổi chiều dịch">
          ⇄
        </button>
        <span>{isVi2Zh ? 'Tiếng Trung' : 'Tiếng Việt'}</span>
      </div>

      <textarea
        className="translate__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isVi2Zh ? 'Nhập câu tiếng Việt…' : '输入中文…'}
        rows={3}
        maxLength={500}
      />

      <button type="button" className="translate__submit" onClick={submit} disabled={!text.trim() || loading}>
        {loading ? 'Đang dịch…' : 'Dịch'}
      </button>

      <AiErrorBanner code={errorCode} onRetry={submit} />

      {result && (
        <div className="translate__result">
          <div className="translate__zh">
            <p className="translate__hanzi">
              {result.hanzi}
              {isSupported && (
                <button type="button" onClick={() => speak(result.hanzi)} title="Nghe">
                  🔊
                </button>
              )}
            </p>
            <p className="translate__pinyin">{result.pinyin}</p>
          </div>
          <p className="translate__vi">{result.vi}</p>
          {result.note && <p className="translate__note">💡 {result.note}</p>}
        </div>
      )}
    </div>
  );
}
