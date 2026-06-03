import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/tokens.css';
import './styles/global.css';
import { ThemeProvider } from './theme/theme-context';
import { ProgressProvider } from './progress/progress-context';
import { App } from './app';
import { HomePage } from './routes/home-page';
import { LessonPage } from './components/lesson/lesson-page';
import { ReviewPage } from './components/review/review-page';
import { TutorPage } from './components/tutor/tutor-page';
import { AiHubPage } from './components/ai/ai-hub-page';
import { SentenceGrader } from './components/grade/sentence-grader';
import { AiExercisePanel } from './components/exercise/ai-exercise-panel';
import { ConversationPage } from './components/conversation/conversation-page';
import { TranslatorPage } from './components/translate/translator-page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'lesson/:id', element: <LessonPage /> },
      { path: 'review/:id', element: <ReviewPage /> },
      { path: 'ai', element: <AiHubPage /> },
      { path: 'tutor', element: <TutorPage /> },
      { path: 'practice/grade', element: <SentenceGrader /> },
      { path: 'practice/generate', element: <AiExercisePanel /> },
      { path: 'practice/conversation', element: <ConversationPage /> },
      { path: 'practice/translate', element: <TranslatorPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </ThemeProvider>
  </StrictMode>,
);
