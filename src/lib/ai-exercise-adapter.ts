import type { Exercise } from './ai-contracts';
import type { McqQuestion } from './drill-engine';
import type { VocabItem } from '../content/content-types';

/**
 * Map bài tập AI (Exercise) → McqQuestion để tái dùng McqQuestionCard hiện có.
 * McqQuestionCard chỉ đọc các field hiển thị, không dùng `vocab` → stub là đủ.
 */
function stubVocab(hanzi: string): VocabItem {
  return { hanzi, pinyin: '', vi: '', tones: [] };
}

export function exerciseToMcq(ex: Exercise): McqQuestion {
  // 'listen' → đọc audio; 'meaning'/'fill' → hiện hán tự.
  const mode = ex.type === 'listen' ? 'listen' : 'meaning';
  return {
    mode,
    vocab: stubVocab(ex.promptHanzi),
    promptHanzi: ex.promptHanzi,
    questionText: ex.questionText,
    options: ex.options,
    answerIndex: ex.answerIndex,
    speakPrompt: ex.type === 'listen',
  };
}

export function exercisesToMcq(exercises: Exercise[]): McqQuestion[] {
  return exercises.map(exerciseToMcq);
}
