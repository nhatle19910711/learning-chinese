import { useSpeech } from '../../hooks/use-speech';
import type { ChatMessage as Msg } from '../../hooks/use-ai-chat';

// Bắt các cụm hán tự (để nút TTS chỉ đọc phần tiếng Trung).
const HAN_RUN = /[一-鿿]+/g;

interface Props {
  msg: Msg;
}

export function ChatMessage({ msg }: Props) {
  const { speak, isSupported } = useSpeech();
  const isUser = msg.role === 'user';
  const han = msg.text.match(HAN_RUN)?.join('，') ?? '';

  return (
    <div className={`chat-msg chat-msg--${isUser ? 'user' : 'model'}`}>
      <div className="chat-msg__bubble">
        <div className="chat-msg__text">
          {msg.text
            ? msg.text.split('\n').map((line, i) => <p key={i}>{line || ' '}</p>)
            : <p className="chat-msg__typing">…</p>}
        </div>
        {!isUser && han && isSupported && (
          <button
            type="button"
            className="chat-msg__tts"
            onClick={() => speak(han)}
            title="Nghe phần tiếng Trung"
          >
            🔊
          </button>
        )}
      </div>
    </div>
  );
}
