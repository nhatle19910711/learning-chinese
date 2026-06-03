import { useCallback, useRef, useState } from 'react';
import { AiError, postStream } from '../lib/ai-client';
import type { AiErrorCode, ChatTurn } from '../lib/ai-contracts';

export interface ChatMessage extends ChatTurn {
  id: string;
}

interface Options {
  endpoint?: string; // mặc định /api/chat (Phase 05 dùng /api/conversation)
  systemContext?: string; // ngữ cảnh thêm gửi cho server
  extra?: Record<string, unknown>; // field thêm vào body (vd scenarioId)
}

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

/**
 * Hook chat streaming dùng chung cho gia sư (Phase 02) và hội thoại (Phase 05).
 * Quản lý lịch sử tin nhắn, gọi SSE, append token vào bong bóng model.
 */
export function useAiChat({ endpoint = '/api/chat', systemContext, extra }: Options = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorCode, setErrorCode] = useState<AiErrorCode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // giữ giá trị mới nhất để callback ổn định, không phụ thuộc messages
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || abortRef.current) return;
      setErrorCode(null);

      const userMsg: ChatMessage = { id: nextId(), role: 'user', text: trimmed };
      const modelMsg: ChatMessage = { id: nextId(), role: 'model', text: '' };
      const history = [...messagesRef.current, userMsg];
      setMessages([...history, modelMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await postStream(
          endpoint,
          {
            messages: history.map(({ role, text }) => ({ role, text })),
            systemContext,
            ...extra,
          },
          (token) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === modelMsg.id ? { ...m, text: m.text + token } : m)),
            );
          },
          controller.signal,
        );
        // AI không trả gì → bỏ bong bóng rỗng (tránh kẹt dấu "…").
        setMessages((prev) => prev.filter((m) => !(m.id === modelMsg.id && !m.text.trim())));
      } catch (e) {
        setErrorCode(e instanceof AiError ? e.code : 'server');
        // bỏ bong bóng model rỗng nếu lỗi ngay từ đầu
        setMessages((prev) => prev.filter((m) => !(m.id === modelMsg.id && !m.text)));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [endpoint, systemContext, extra],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setErrorCode(null);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, errorCode, send, stop, reset, setMessages };
}
