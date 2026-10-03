// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/00_OVERVIEW.md]
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { t as baseT, Language, TranslationKey } from '@40labs/i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

let db: any = null;
if (Platform.OS !== 'web') {
  try {
    db = SQLite.openDatabaseSync('orbit_theme.db');
    db.execSync('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
  } catch {
    // Fallback for test environments without SQLite native module
  }
}

function getStoredLanguage(): Language {
  if (Platform.OS === 'web') {
    try {
      const val = localStorage.getItem('orbit_language');
      if (val === 'sw-TZ' || val === 'en' || val === 'sw') return val;
    } catch {
      // ignore
    }
    return 'sw-TZ';
  }

  if (!db) return 'sw-TZ';
  try {
    const row = db.getFirstSync('SELECT value FROM settings WHERE key = ?', ['language']) as { value: string } | null;
    if (row && (row.value === 'sw-TZ' || row.value === 'en' || row.value === 'sw')) {
      return row.value as Language;
    }
  } catch {
    // ignore
  }
  return 'sw-TZ';
}

function saveStoredLanguage(lang: Language) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem('orbit_language', lang);
    } catch {
      // ignore
    }
    return;
  }

  if (!db) return;
  try {
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['language', lang]);
  } catch {
    // ignore
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    saveStoredLanguage(newLang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = baseT(key, language);
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }
    return translation;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
