import { useState, type KeyboardEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState('');

  const submit = () => {
    const t = value.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Nhập câu hỏi… (Enter để gửi, Shift+Enter xuống dòng)"
        rows={2}
      />
      {isStreaming ? (
        <button type="button" className="chat-input__btn chat-input__btn--stop" onClick={onStop}>
          Dừng
        </button>
      ) : (
        <button
          type="button"
          className="chat-input__btn"
          onClick={submit}
          disabled={!value.trim()}
        >
          Gửi
        </button>
      )}
    </div>
  );
}
