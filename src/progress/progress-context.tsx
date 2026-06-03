import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  type ProgressState,
  type WordStatus,
} from '../lib/progress-store';
import { getLessonById, vocabKey } from '../content/content-index';

export interface LessonProgress {
  total: number;
  known: number;
  done: boolean;
}

interface ProgressContextValue {
  setWordStatus: (lessonId: string, hanzi: string, status: WordStatus) => void;
  getWordStatus: (lessonId: string, hanzi: string) => WordStatus;
  wordStatusMap: Record<string, WordStatus>;
  markLessonDone: (lessonId: string) => void;
  getLessonProgress: (lessonId: string) => LessonProgress;
  resetProgress: () => void;
  importProgress: (state: ProgressState) => void;
  state: ProgressState;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadProgress());
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // không ghi đè ngay khi mount
    }
    saveProgress(state);
  }, [state]);

  const setWordStatus = useCallback((lessonId: string, hanzi: string, status: WordStatus) => {
    setState((s) => ({ ...s, wordStatus: { ...s.wordStatus, [vocabKey(lessonId, hanzi)]: status } }));
  }, []);

  const getWordStatus = useCallback(
    (lessonId: string, hanzi: string): WordStatus => state.wordStatus[vocabKey(lessonId, hanzi)] ?? 'new',
    [state.wordStatus],
  );

  const markLessonDone = useCallback((lessonId: string) => {
    setState((s) =>
      s.lessonsDone.includes(lessonId) ? s : { ...s, lessonsDone: [...s.lessonsDone, lessonId] },
    );
  }, []);

  const getLessonProgress = useCallback(
    (lessonId: string): LessonProgress => {
      const lesson = getLessonById(lessonId);
      const total = lesson?.vocab.length ?? 0;
      let known = 0;
      if (lesson) {
        for (const v of lesson.vocab) {
          if (state.wordStatus[vocabKey(lessonId, v.hanzi)] === 'known') known += 1;
        }
      }
      return { total, known, done: state.lessonsDone.includes(lessonId) };
    },
    [state.wordStatus, state.lessonsDone],
  );

  const resetProgress = useCallback(() => setState(defaultProgress()), []);
  const importProgress = useCallback((next: ProgressState) => setState(next), []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      setWordStatus,
      getWordStatus,
      wordStatusMap: state.wordStatus,
      markLessonDone,
      getLessonProgress,
      resetProgress,
      importProgress,
      state,
    }),
    [setWordStatus, getWordStatus, markLessonDone, getLessonProgress, resetProgress, importProgress, state],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress phải dùng trong ProgressProvider');
  return ctx;
}
