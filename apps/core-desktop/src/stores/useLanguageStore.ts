import { create } from 'zustand';

export type Lang = 'sw' | 'en';
export type LangSource = 'system' | 'user';

const STORAGE_KEY_LANG = '40labs_language';
const STORAGE_KEY_LANG_SOURCE = '40labs_lang_source';

const detectSystemLang = (): Lang => {
  if (typeof window === 'undefined' || !navigator) return 'sw';
  const langs = navigator.languages ? Array.from(navigator.languages) : [navigator.language];
  for (const l of langs) {
    if (!l) continue;
    const lower = l.toLowerCase();
    if (lower.startsWith('sw')) return 'sw';
    if (lower.startsWith('en')) return 'en';
  }
  return 'sw';
};

const getInitialLang = (): { language: Lang; langSource: LangSource } => {
  if (typeof window === 'undefined') return { language: 'sw', langSource: 'system' };
  try {
    const savedSource = localStorage.getItem(STORAGE_KEY_LANG_SOURCE) as LangSource;
    const savedLang = localStorage.getItem(STORAGE_KEY_LANG) as Lang;
    if (savedSource === 'user' && (savedLang === 'sw' || savedLang === 'en')) {
      return { language: savedLang, langSource: 'user' };
    }
    if (savedLang === 'sw' || savedLang === 'en' || savedLang === 'sw-TZ') {
      const normalized: Lang = savedLang === 'en' ? 'en' : 'sw';
      return { language: normalized, langSource: savedSource === 'user' ? 'user' : 'system' };
    }
  } catch {
    // ignore
  }
  return { language: detectSystemLang(), langSource: 'system' };
};

interface LanguageState {
  language: Lang;
  langSource: LangSource;
  setLanguage: (lang: Lang) => void;
}

export const useLanguageStore = create<LanguageState>((set) => {
  const initial = getInitialLang();

  return {
    language: initial.language,
    langSource: initial.langSource,
    setLanguage: (language: Lang) => {
      set({ language, langSource: 'user' });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_LANG, language);
          localStorage.setItem(STORAGE_KEY_LANG_SOURCE, 'user');
        } catch {
          // ignore
        }
      }
    },
  };
});
