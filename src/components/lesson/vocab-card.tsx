import { useState } from 'react';
import type { VocabItem } from '../../content/content-types';
import { AudioButton } from './audio-button';
import { PinyinText } from './pinyin-text';
import { StrokeOrderViewer } from './stroke-order-viewer';

/** Thẻ một từ vựng: hanzi + pinyin (tô màu thanh điệu) + nghĩa + audio + nét viết + ví dụ. */
export function VocabCard({ item }: { item: VocabItem }) {
  const [showStroke, setShowStroke] = useState(false);

  return (
    <article className="card vocab-card">
      <div className="vocab-card__top">
        <div className="vocab-card__main">
          <span className="hanzi vocab-card__hanzi">{item.hanzi}</span>
          <PinyinText pinyin={item.pinyin} tones={item.tones} />
          <span className="vocab-card__vi">{item.vi}</span>
        </div>
        <div className="vocab-card__actions">
          <AudioButton text={item.hanzi} />
          <button
            type="button"
            className="audio-btn"
            onClick={() => setShowStroke((s) => !s)}
            aria-expanded={showStroke}
            title="Xem nét viết"
          >
            ✍️
          </button>
        </div>
      </div>

      {showStroke && <StrokeOrderViewer hanzi={item.hanzi} />}

      {item.example && (
        <div className="vocab-card__example">
          <span className="hanzi">{item.example.hanzi}</span>
          <PinyinText pinyin={item.example.pinyin} tones={[]} colored={false} />
          <span className="text-muted">{item.example.vi}</span>
          <AudioButton text={item.example.hanzi} label={`Nghe ví dụ ${item.example.hanzi}`} />
        </div>
      )}
    </article>
  );
}
