import { create } from 'zustand';
import { i18n } from '@40labs/i18n';

export type ThemeMode = 'dark' | 'light' | 'system';
export type Lang = 'sw' | 'en';

const STORAGE_KEY_THEME = '40labs_theme';
const STORAGE_KEY_LANG = '40labs_language';

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

const getInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'sw';
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved === 'en' || saved === 'sw' || saved === 'sw-TZ') {
      return saved === 'en' ? 'en' : 'sw';
    }
  } catch {
    // ignore
  }
  return 'sw'; // First launch = Swahili regardless of OS locale. No auto-detect.
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

interface PreferencesState {
  theme: ThemeMode;
  language: Lang;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (language: Lang) => void;
}

export const useThemeStore = create<PreferencesState>((set, get) => {
  const initialTheme = getInitialTheme();
  const initialLang = getInitialLang();
  const resolved = resolveTheme(initialTheme);

  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.lang = initialLang === 'sw' ? 'sw-TZ' : 'en-TZ';
    i18n.changeLanguage(initialLang);

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
    theme: initialTheme,
    language: initialLang,
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
    setLanguage: (language: Lang) => {
      set({ language });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_LANG, language);
        } catch {
          // ignore
        }
        i18n.changeLanguage(language);
        document.documentElement.lang = language === 'sw' ? 'sw-TZ' : 'en-TZ';
      }
    },
  };
});

export const useLanguageStore = (selector?: (state: { language: Lang; setLanguage: (l: Lang) => void }) => any) => {
  const store = useThemeStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
  }));
  return selector ? selector(store) : store;
};

useLanguageStore.getState = () => ({
  language: useThemeStore.getState().language,
  setLanguage: useThemeStore.getState().setLanguage,
});

useLanguageStore.setState = (partial: any) => {
  if (typeof partial === 'function') {
    const next = partial(useLanguageStore.getState());
    if (next.language) useThemeStore.getState().setLanguage(next.language);
  } else if (partial.language) {
    useThemeStore.getState().setLanguage(partial.language);
  }
};

useLanguageStore.subscribe = (listener: any) => {
  return useThemeStore.subscribe((state) => listener({ language: state.language }));
};
