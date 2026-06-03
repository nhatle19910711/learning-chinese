import { Link } from 'react-router-dom';
import { useTheme } from '../../theme/theme-context';
import { PageContainer } from './page-container';

/** Header dính trên cùng: thương hiệu + toggle dark mode. */
export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="app-header">
      <PageContainer>
        <div className="app-header__inner">
          <Link to="/" className="app-header__brand">
            <span className="app-header__logo">中</span>
            <span>Học Tiếng Trung</span>
          </Link>
          <nav className="app-header__nav">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
              title={theme === 'dark' ? 'Nền sáng' : 'Nền tối'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </PageContainer>
    </header>
  );
}
