import { toneColor } from '../../lib/tone-colors';

interface PinyinTextProps {
  pinyin: string;
  tones: number[];
  colored?: boolean;
}

/** Hiển thị pinyin, tô màu từng âm tiết theo thanh điệu (nếu colored). */
export function PinyinText({ pinyin, tones, colored = true }: PinyinTextProps) {
  const syllables = pinyin.split(/\s+/);
  if (!colored) return <span className="pinyin">{pinyin}</span>;
  return (
    <span className="pinyin">
      {syllables.map((syl, i) => (
        <span key={i} style={{ color: toneColor(tones[i] ?? -1) }}>
          {syl}
          {i < syllables.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}
