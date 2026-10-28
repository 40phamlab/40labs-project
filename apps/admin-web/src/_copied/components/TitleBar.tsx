// COPIED FROM: apps/core-desktop/src/components/TitleBar.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, UserRound } from 'lucide-react';

export interface TitleBarProps {
  brandName?: string;
  onSettingsClick?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  brandName = '40Labs Admin',
  onSettingsClick,
}) => {
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [theme, setTheme] = React.useState(() => localStorage.getItem('40labs-admin-theme') || 'dark');
  const environment = import.meta.env.VITE_APP_ENV || (import.meta.env.MODE === 'production' ? 'Production' : 'Development');
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/businesses?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('40labs-admin-theme', next);
    setTheme(next);
  };

  return (
    <div className="h-10 w-full flex items-center justify-between px-2 bg-app-bg select-none shrink-0 z-[110]">
      <div className="flex items-center gap-1.5 h-full min-w-0 shrink-0">
        <span className="px-2 font-heading font-bold text-xs tracking-tight text-text-primary">{brandName}</span>

        <form onSubmit={handleGlobalSearchSubmit} className="relative hidden md:flex items-center ml-2">
          <Search size={13} className="absolute left-2.5 text-text-muted" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search businesses..."
            className="w-40 lg:w-56 pl-7 pr-2 py-1 bg-surface border border-border rounded text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary"
          />
        </form>
      </div>

      <div className="flex-1 h-full" />

      <div className="flex items-center gap-3 shrink-0 h-full text-text-muted">
        <span className="rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">{environment}</span>
        <button type="button" onClick={toggleTheme} className="rounded-md p-2 hover:bg-surface-hover hover:text-text-primary" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button type="button" onClick={() => onSettingsClick?.()} className="rounded-md p-2 hover:bg-surface-hover hover:text-text-primary" aria-label="Open account settings">
          <UserRound size={15} />
        </button>
      </div>
    </div>
  );
};
