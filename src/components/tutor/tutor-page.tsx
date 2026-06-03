import { useEffect, useRef } from 'react';
import { PageContainer } from '../layout/page-container';
import { PasscodeGate } from '../ai/passcode-gate';
import { AiErrorBanner } from '../ai/ai-error-banner';
import { useAiChat } from '../../hooks/use-ai-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import './chat.css';

const SUGGESTIONS = [
  'Phân biệt 你 và 您 khi nào dùng?',
  'Giải thích 4 thanh điệu trong pinyin',
  'Cách dùng chữ 是 (shì) trong câu',
  'Dạy tôi đếm số từ 1 đến 10',
];

export function TutorPage() {
  return (
    <PageContainer>
      <PasscodeGate>
        <TutorChat />
      </PasscodeGate>
    </PageContainer>
  );
}

function TutorChat() {
  const { messages, isStreaming, errorCode, send, stop } = useAiChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="tutor">
      <header className="tutor__head">
        <h1>🧑‍🏫 Gia sư AI</h1>
        <p className="text-muted">
          Hỏi bất cứ điều gì về tiếng Trung — ngữ pháp, pinyin, thanh điệu, từ vựng.
        </p>
      </header>

      <div className="chat-thread">
        {messages.length === 0 ? (
          <div className="chat-suggestions">
            <p className="text-muted">Gợi ý câu hỏi:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} msg={m} />)
        )}
        <div ref={endRef} />
      </div>

      <AiErrorBanner code={errorCode} />
      <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}
