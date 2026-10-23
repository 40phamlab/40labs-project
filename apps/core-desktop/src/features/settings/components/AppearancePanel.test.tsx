import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import { AppearancePanel } from './AppearancePanel';
import { useThemeStore } from '../../../stores/useThemeStore';

describe('AppearancePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().setLanguage('sw');
  });

  afterEach(() => {
    cleanup();
  });

  test('changes the application theme immediately and persists the preference', () => {
    render(<AppearancePanel />);

    fireEvent.click(screen.getByRole('button', { name: /light/i }));

    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('40labs_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  test('changes the application language immediately and persists the preference', () => {
    render(<AppearancePanel />);

    fireEvent.click(screen.getByRole('button', { name: /english/i }));

    expect(useThemeStore.getState().language).toBe('en');
    expect(localStorage.getItem('40labs_language')).toBe('en');
    expect(document.documentElement.lang).toBe('en-TZ');
  });
});
