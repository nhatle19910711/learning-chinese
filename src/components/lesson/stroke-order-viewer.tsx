import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';

interface StrokeOrderViewerProps {
  hanzi: string;
}

const CJK = /[一-鿿]/;

/** Hiển thị nét viết từng ký tự Hán bằng hanzi-writer (dữ liệu nét tải từ CDN). */
export function StrokeOrderViewer({ hanzi }: StrokeOrderViewerProps) {
  const chars = [...hanzi].filter((c) => CJK.test(c));
  const containerRef = useRef<HTMLDivElement>(null);
  const writersRef = useRef<HanziWriter[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    writersRef.current = [];

    chars.forEach((char) => {
      const target = document.createElement('div');
      target.className = 'stroke-target';
      container.appendChild(target);
      try {
        const writer = HanziWriter.create(target, char, {
          width: 96,
          height: 96,
          padding: 6,
          showOutline: true,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 180,
          strokeColor: '#d23b3b',
          outlineColor: '#cbd0db',
        });
        writersRef.current.push(writer);
      } catch {
        setError(true);
      }
    });

    return () => {
      writersRef.current = [];
      if (container) container.innerHTML = '';
    };
  }, [hanzi]);

  const animateAll = () => {
    writersRef.current.forEach((w, i) => {
      setTimeout(() => w.animateCharacter(), i * 700);
    });
  };

  if (chars.length === 0) return null;

  return (
    <div className="stroke-viewer">
      <div className="stroke-row" ref={containerRef} />
      {error ? (
        <p className="text-muted stroke-hint">Không tải được dữ liệu nét viết.</p>
      ) : (
        <button type="button" className="btn stroke-replay" onClick={animateAll}>
          ▶ Xem lại nét viết
        </button>
      )}
    </div>
  );
}
