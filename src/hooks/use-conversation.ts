import { useCallback, useRef, useState } from 'react';
import { AiError, postStream } from '../lib/ai-client';
import type { AiErrorCode } from '../lib/ai-contracts';

export interface ConvTurn {
  id: string;
  role: 'user' | 'model';
  text: string; // user: câu người học nhập; model: khối ZH/PINYIN/VI thô
}

let cid = 0;
const nid = () => `c${++cid}`;

/**
 * Quản lý hội thoại roleplay (Phase 05). Khác useAiChat ở chỗ AI mở lời trước
 * (open) và lượt model là khối ZH/PINYIN/VI thô để parser hiển thị.
 * Tái dùng postStream/AiError/passcode từ ai-client (DRY ở tầng hạ tầng).
 */
export function useConversation(scenarioId: string) {
  const [turns, setTurns] = useState<ConvTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorCode, setErrorCode] = useState<AiErrorCode | null>(null);
  const turnsRef = useRef<ConvTurn[]>([]);
  turnsRef.current = turns;
  const abortRef = useRef<AbortController | null>(null);

  const streamModel = useCallback(
    async (history: ConvTurn[]) => {
      const modelTurn: ConvTurn = { id: nid(), role: 'model', text: '' };
      setTurns([...history, modelTurn]);
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await postStream(
          '/api/conversation',
          { scenarioId, messages: history.map(({ role, text }) => ({ role, text })) },
          (tok) =>
            setTurns((prev) => prev.map((t) => (t.id === modelTurn.id ? { ...t, text: t.text + tok } : t))),
          controller.signal,
        );
        // AI không trả gì → bỏ lượt rỗng.
        setTurns((prev) => prev.filter((t) => !(t.id === modelTurn.id && !t.text.trim())));
      } catch (e) {
        setErrorCode(e instanceof AiError ? e.code : 'server');
        setTurns((prev) => prev.filter((t) => !(t.id === modelTurn.id && !t.text)));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [scenarioId],
  );

  /** AI mở đầu hội thoại (chỉ chạy khi chưa có lượt nào). */
  const open = useCallback(() => {
    if (turnsRef.current.length || abortRef.current) return;
    setErrorCode(null);
    void streamModel([]);
  }, [streamModel]);

  /** Người học trả lời. */
  const reply = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || abortRef.current) return;
      setErrorCode(null);
      const userTurn: ConvTurn = { id: nid(), role: 'user', text: t };
      void streamModel([...turnsRef.current, userTurn]);
    },
    [streamModel],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  return { turns, isStreaming, errorCode, open, reply, stop };
}
