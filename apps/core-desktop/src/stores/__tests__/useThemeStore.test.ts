import { describe, test, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../useThemeStore';

describe('useThemeStore (Theme & Language Preferences Controller)', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'system', language: 'sw' });
  });

  test('initializes with system theme and swahili language by default', () => {
    expect(useThemeStore.getState().theme).toBe('system');
    expect(useThemeStore.getState().language).toBe('sw');
  });

  test('switches theme correctly and updates DOM / localStorage', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('40labs_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('40labs_theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('switches language correctly and updates DOM / localStorage', () => {
    useThemeStore.getState().setLanguage('en');
    expect(useThemeStore.getState().language).toBe('en');
    expect(localStorage.getItem('40labs_language')).toBe('en');
    expect(document.documentElement.lang).toBe('en-TZ');

    useThemeStore.getState().setLanguage('sw');
    expect(useThemeStore.getState().language).toBe('sw');
    expect(localStorage.getItem('40labs_language')).toBe('sw');
    expect(document.documentElement.lang).toBe('sw-TZ');
  });

  test('toggles theme between dark, light, and system', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('system');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
