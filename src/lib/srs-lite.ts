import type { WordStatus } from './progress-store';
import type { VocabItem } from '../content/content-types';
import { vocabKey } from '../content/content-index';

/** SRS tối giản: new → learning → known khi đúng; sai thì lùi 1 bậc. */
export function nextStatus(current: WordStatus | undefined, isCorrect: boolean): WordStatus {
  const cur = current ?? 'new';
  if (isCorrect) {
    if (cur === 'new') return 'learning';
    if (cur === 'learning') return 'known';
    return 'known';
  }
  // sai
  if (cur === 'known') return 'learning';
  return 'learning';
}

/** Thứ tự ôn: ưu tiên từ chưa thuộc (new/learning) trước, known sau cùng. */
export function pickReviewOrder(
  lessonId: string,
  vocab: VocabItem[],
  wordStatus: Record<string, WordStatus>,
): VocabItem[] {
  const weight = (v: VocabItem): number => {
    const s = wordStatus[vocabKey(lessonId, v.hanzi)] ?? 'new';
    if (s === 'new') return 0;
    if (s === 'learning') return 1;
    return 2; // known
  };
  return [...vocab].sort((a, b) => weight(a) - weight(b));
}
