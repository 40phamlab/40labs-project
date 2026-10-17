import { describe, test, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../useThemeStore';

describe('useThemeStore (Theme Controller)', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'system' });
  });

  test('initializes with system theme by default', () => {
    expect(useThemeStore.getState().theme).toBe('system');
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
