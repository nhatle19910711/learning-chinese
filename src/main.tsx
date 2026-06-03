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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'lesson/:id', element: <LessonPage /> },
      { path: 'review/:id', element: <ReviewPage /> },
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
