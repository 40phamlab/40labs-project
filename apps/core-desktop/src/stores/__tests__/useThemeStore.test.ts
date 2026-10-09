import { describe, test, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../useThemeStore';

describe('useThemeStore (Theme Controller)', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'dark' });
  });

  test('initializes with dark theme by default', () => {
    const store = useThemeStore.getState();
    expect(store.theme).toBe('dark');
  });

  test('switches theme correctly and updates DOM / localStorage', () => {
    const store = useThemeStore.getState();

    store.setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('40labs_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    store.setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('40labs_theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('toggles theme between dark and light', () => {
    const store = useThemeStore.getState();
    expect(store.theme).toBe('dark');

    store.toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');

    store.toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
