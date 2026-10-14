import { create } from 'zustand';
import type { Language } from '@40labs/i18n';

const STORAGE_KEY_LANG = '40labs_language';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => {
  const initial = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LANG) : 'sw-TZ') as Language || 'sw-TZ';

  return {
    language: initial,
    setLanguage: (language: Language) => {
      set({ language });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LANG, language);
      }
    },
  };
});
