import type { Lesson } from './content-types';
import pinyinTones from './lessons/lesson-00-pinyin-tones.json';
import greetings from './lessons/lesson-01-greetings.json';
import numbersAge from './lessons/lesson-02-numbers-age.json';
import pronounsFamily from './lessons/lesson-03-pronouns-family.json';
import timeDates from './lessons/lesson-04-time-dates.json';
import dailyObjects from './lessons/lesson-05-daily-objects.json';

// JSON → Lesson. Cast qua unknown vì TS suy luận `level`/`tones` rộng hơn union.
const raw: Lesson[] = [
  pinyinTones,
  greetings,
  numbersAge,
  pronounsFamily,
  timeDates,
  dailyObjects,
] as unknown as Lesson[];

export const lessons: Lesson[] = [...raw].sort((a, b) => a.order - b.order);

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

/** Khóa định danh từ vựng dùng cho lưu tiến độ (hanzi đủ phân biệt trong phạm vi MVP). */
export function vocabKey(lessonId: string, hanzi: string): string {
  return `${lessonId}:${hanzi}`;
}
