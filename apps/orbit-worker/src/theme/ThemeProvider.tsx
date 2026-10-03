// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { darkTokens, lightTokens } from '@40labs/design-tokens';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: typeof darkTokens.colors;
  tokens: typeof darkTokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

let db: any = null;
if (Platform.OS !== 'web') {
  try {
    db = SQLite.openDatabaseSync('orbit_theme.db');
    db.execSync('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
  } catch {
    // Fallback for test environments without SQLite native module
  }
}

function getStoredTheme(): ThemeMode {
  if (Platform.OS === 'web') {
    try {
      const val = localStorage.getItem('orbit_theme');
      if (val === 'dark' || val === 'light') return val;
    } catch {
      // ignore
    }
    return 'dark';
  }

  if (!db) return 'dark';
  try {
    const row = db.getFirstSync('SELECT value FROM settings WHERE key = ?', ['theme']) as { value: string } | null;
    if (row && (row.value === 'dark' || row.value === 'light')) {
      return row.value;
    }
  } catch {
    // ignore
  }
  return 'dark';
}

function saveStoredTheme(mode: ThemeMode) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem('orbit_theme', mode);
    } catch {
      // ignore
    }
    return;
  }

  if (!db) return;
  try {
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['theme', mode]);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveStoredTheme(newTheme);
  };

  const activeTokens = theme === 'dark' ? darkTokens : lightTokens;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        colors: activeTokens.colors as typeof darkTokens.colors,
        tokens: activeTokens as typeof darkTokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
