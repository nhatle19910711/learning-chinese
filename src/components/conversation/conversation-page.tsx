import { useEffect, useRef, useState } from 'react';
import { PageContainer } from '../layout/page-container';
import { PasscodeGate } from '../ai/passcode-gate';
import { AiErrorBanner } from '../ai/ai-error-banner';
import { ChatInput } from '../tutor/chat-input';
import { useConversation } from '../../hooks/use-conversation';
import { getScenarioMeta } from '../../lib/conversation-scenarios';
import { ScenarioPicker } from './scenario-picker';
import { DialogueTurn } from './dialogue-turn';
import './conversation.css';

export function ConversationPage() {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  return (
    <PageContainer>
      <PasscodeGate>
        {scenarioId ? (
          <ConversationView
            key={scenarioId}
            scenarioId={scenarioId}
            onExit={() => setScenarioId(null)}
          />
        ) : (
          <ScenarioPicker onPick={setScenarioId} />
        )}
      </PasscodeGate>
    </PageContainer>
  );
}

function ConversationView({ scenarioId, onExit }: { scenarioId: string; onExit: () => void }) {
  const { turns, isStreaming, errorCode, open, reply, stop } = useConversation(scenarioId);
  const meta = getScenarioMeta(scenarioId);
  const endRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);

  // AI mở lời một lần khi vào (guard StrictMode double-mount).
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    open();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  return (
    <div className="conv">
      <header className="conv__bar">
        <button type="button" className="conv__exit" onClick={onExit}>
          ← Đổi tình huống
        </button>
        <span className="conv__title">
          {meta?.icon} {meta?.title}
        </span>
      </header>

      <div className="conv__thread">
        {turns.map((t) => (
          <DialogueTurn key={t.id} turn={t} />
        ))}
        <div ref={endRef} />
      </div>

      <AiErrorBanner code={errorCode} />
      <ChatInput onSend={reply} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}
