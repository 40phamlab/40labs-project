import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY_THEME = '40labs_theme';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch {
    // ignore
  }
  return 'system';
};

const resolveTheme = (mode: ThemeMode): 'dark' | 'light' => {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return mode;
};

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  const resolved = resolveTheme(initial);

  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (get().theme === 'system') {
          const sysResolved = e.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', sysResolved);
          document.documentElement.style.colorScheme = sysResolved;
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      }
    } catch {
      // ignore
    }
  }

  return {
    theme: initial,
    setTheme: (theme: ThemeMode) => {
      set({ theme });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_THEME, theme);
        } catch {
          // ignore
        }
        const res = resolveTheme(theme);
        document.documentElement.setAttribute('data-theme', res);
        document.documentElement.style.colorScheme = res;
      }
    },
    toggleTheme: () => {
      const current = get().theme;
      const next: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
      get().setTheme(next);
    },
  };
});
