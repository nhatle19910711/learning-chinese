import type { VocabItem } from '../content/content-types';
import { TONE_LABELS } from './tone-colors';

export type DrillMode = 'meaning' | 'listen' | 'tone';

export interface McqQuestion {
  mode: DrillMode;
  vocab: VocabItem; // từ đích (để cập nhật SRS)
  promptHanzi: string; // hanzi để hiện hoặc đọc
  questionText: string;
  options: string[]; // nội dung hiển thị mỗi lựa chọn
  answerIndex: number;
  speakPrompt: boolean; // true → đọc bằng audio thay vì hiện hanzi
}

const TONE_OPTIONS = [1, 2, 3, 4, 0];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lấy tối đa `n` mục nhiễu khác đáp án đúng (theo trường `field`). */
function pickDistractors(pool: VocabItem[], correct: VocabItem, field: 'vi' | 'hanzi', n: number) {
  const seen = new Set<string>([correct[field]]);
  const unique = pool.filter((v) => {
    if (seen.has(v[field])) return false;
    seen.add(v[field]);
    return true;
  });
  return shuffle(unique).slice(0, n);
}

function buildOptions(correct: string, distractors: string[]): { options: string[]; answerIndex: number } {
  const options = shuffle([correct, ...distractors]);
  return { options, answerIndex: options.indexOf(correct) };
}

function meaningQuestion(target: VocabItem, pool: VocabItem[]): McqQuestion {
  const distractors = pickDistractors(pool, target, 'vi', 3).map((v) => v.vi);
  const { options, answerIndex } = buildOptions(target.vi, distractors);
  return {
    mode: 'meaning',
    vocab: target,
    promptHanzi: target.hanzi,
    questionText: 'Từ này nghĩa là gì?',
    options,
    answerIndex,
    speakPrompt: false,
  };
}

function listenQuestion(target: VocabItem, pool: VocabItem[]): McqQuestion {
  const distractors = pickDistractors(pool, target, 'hanzi', 3).map((v) => v.hanzi);
  const { options, answerIndex } = buildOptions(target.hanzi, distractors);
  return {
    mode: 'listen',
    vocab: target,
    promptHanzi: target.hanzi,
    questionText: 'Nghe và chọn chữ đúng:',
    options,
    answerIndex,
    speakPrompt: true,
  };
}

function toneQuestion(target: VocabItem): McqQuestion {
  const idx = Math.floor(Math.random() * target.tones.length);
  const correctLabel = TONE_LABELS[target.tones[idx]];
  // Trộn nhãn để vị trí đáp án đúng không cố định.
  const options = shuffle(TONE_OPTIONS.map((t) => TONE_LABELS[t]));
  return {
    mode: 'tone',
    vocab: target,
    promptHanzi: target.hanzi,
    questionText:
      target.tones.length > 1
        ? `Thanh điệu của âm tiết thứ ${idx + 1} (${target.pinyin}) là gì?`
        : `Thanh điệu của "${target.pinyin}" là gì?`,
    options,
    answerIndex: options.indexOf(correctLabel),
    speakPrompt: false,
  };
}

/**
 * Sinh phiên ôn tập MCQ. mode 'mixed' trộn các loại.
 * allowListen=false (thiết bị không có giọng zh) → loại bỏ dạng nghe.
 */
export function generateMcqSession(
  vocab: VocabItem[],
  mode: DrillMode | 'mixed',
  count: number,
  allowListen = true,
): McqQuestion[] {
  const targets = shuffle(vocab).slice(0, Math.min(count, vocab.length));
  const mixedModes: DrillMode[] = allowListen ? ['meaning', 'listen', 'tone'] : ['meaning', 'tone'];
  return targets.map((target) => {
    let actualMode: DrillMode = mode === 'mixed' ? mixedModes[Math.floor(Math.random() * mixedModes.length)] : mode;
    // An toàn: nếu chọn nghe nhưng không có giọng → chuyển sang chọn nghĩa.
    if (actualMode === 'listen' && !allowListen) actualMode = 'meaning';
    if (actualMode === 'meaning') return meaningQuestion(target, vocab);
    if (actualMode === 'listen') return listenQuestion(target, vocab);
    return toneQuestion(target);
  });
}
