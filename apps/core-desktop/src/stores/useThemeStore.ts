import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY_THEME = '40labs_theme';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
};

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initial);
  }

  return {
    theme: initial,
    setTheme: (theme: ThemeMode) => {
      set({ theme });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
    },
    toggleTheme: () => {
      const current = get().theme;
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});
