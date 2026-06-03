/** Một âm tiết/từ vựng trong bài học. */
export interface VocabItem {
  hanzi: string; // 你好
  pinyin: string; // "nǐ hǎo"
  vi: string; // nghĩa tiếng Việt
  tones: number[]; // thanh điệu mỗi âm tiết: 1-4, 0 = khinh thanh
  example?: { hanzi: string; pinyin: string; vi: string };
}

export type LessonLevel = 'pinyin' | 'HSK1';

export interface Lesson {
  id: string; // "lesson-01-greetings"
  order: number;
  title: string; // "Bài 1: Chào hỏi"
  level: LessonLevel;
  intro: string; // giải thích tiếng Việt ngắn
  vocab: VocabItem[];
}
