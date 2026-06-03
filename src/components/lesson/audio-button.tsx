import { useSpeech } from '../../hooks/use-speech';

interface AudioButtonProps {
  text: string;
  rate?: number;
  label?: string;
}

/** Nút phát âm. Nếu thiết bị không có giọng tiếng Trung → mờ + tooltip giải thích. */
export function AudioButton({ text, rate = 0.8, label }: AudioButtonProps) {
  const { speak, isSupported } = useSpeech();
  return (
    <button
      type="button"
      className="audio-btn"
      onClick={() => speak(text, rate)}
      disabled={!isSupported}
      title={
        isSupported
          ? 'Nghe phát âm'
          : 'Thiết bị chưa có giọng tiếng Trung. Hãy xem pinyin để đọc theo.'
      }
      aria-label={label ?? `Nghe phát âm ${text}`}
    >
      🔊
    </button>
  );
}
