export type WordStatus = 'new' | 'learning' | 'known';

export interface ProgressState {
  version: 1;
  wordStatus: Record<string, WordStatus>; // key: `${lessonId}:${hanzi}`
  lessonsDone: string[]; // lesson ids đã hoàn thành
}

const STORAGE_KEY = 'lc-progress-v1';

export function defaultProgress(): ProgressState {
  return { version: 1, wordStatus: {}, lessonsDone: [] };
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      version: 1,
      wordStatus: parsed.wordStatus ?? {},
      lessonsDone: parsed.lessonsDone ?? [],
    };
  } catch {
    // JSON hỏng hoặc localStorage bị chặn → trả mặc định, vẫn học được.
    return defaultProgress();
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* bỏ qua nếu không lưu được (private mode / đầy bộ nhớ) */
  }
}

export function exportProgressJson(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function importProgressJson(json: string): ProgressState {
  const parsed = JSON.parse(json) as Partial<ProgressState>;
  return {
    version: 1,
    wordStatus: parsed.wordStatus ?? {},
    lessonsDone: parsed.lessonsDone ?? [],
  };
}
