import { Outlet } from 'react-router-dom';
import { AppHeader } from './components/layout/app-header';

/** Khung layout: header dính trên + vùng nội dung route. */
export function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
