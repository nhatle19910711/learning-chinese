import { useState } from 'react';
import type { VocabItem } from '../../content/content-types';
import { AudioButton } from '../lesson/audio-button';
import { PinyinText } from '../lesson/pinyin-text';

interface DrillFlashcardProps {
  item: VocabItem;
  index: number;
  total: number;
  onResult: (correct: boolean) => void;
}

/** Thẻ lật: hiện hanzi → lật xem pinyin+nghĩa → tự đánh giá Thuộc/Chưa. */
export function DrillFlashcard({ item, index, total, onResult }: DrillFlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="drill">
      <p className="drill__counter text-muted">
        Thẻ {index + 1}/{total}
      </p>
      <button
        type="button"
        className="card flashcard"
        onClick={() => setFlipped((f) => !f)}
        aria-label="Lật thẻ"
      >
        {!flipped ? (
          <span className="hanzi flashcard__hanzi">{item.hanzi}</span>
        ) : (
          <span className="flashcard__back">
            <PinyinText pinyin={item.pinyin} tones={item.tones} />
            <span className="flashcard__vi">{item.vi}</span>
          </span>
        )}
        <span className="flashcard__hint text-muted">{flipped ? '(bấm để lật lại)' : '(bấm để xem nghĩa)'}</span>
      </button>

      <div className="drill__audio-row">
        <AudioButton text={item.hanzi} />
      </div>

      {flipped ? (
        <div className="drill__choices">
          <button type="button" className="btn drill__btn-wrong" onClick={() => onResult(false)}>
            Chưa thuộc
          </button>
          <button type="button" className="btn drill__btn-right" onClick={() => onResult(true)}>
            Đã thuộc ✓
          </button>
        </div>
      ) : (
        <p className="text-muted drill__prompt">Đoán nghĩa rồi lật thẻ để kiểm tra.</p>
      )}
    </div>
  );
}
