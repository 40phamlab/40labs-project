import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import { AppearancePanel } from './AppearancePanel';
import { useThemeStore } from '../../../stores/useThemeStore';

describe('AppearancePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setTheme('dark');
  });

  afterEach(() => {
    cleanup();
  });

  test('changes the application theme immediately and persists the preference', () => {
    render(<AppearancePanel />);

    fireEvent.click(screen.getByRole('switch', { name: /dark mode/i }));

    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('40labs_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    const switchEl = screen.getByRole('switch', { name: /light mode/i }) as HTMLInputElement;
    expect(switchEl.checked).toBe(false);
  });
});
