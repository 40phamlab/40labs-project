import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { AppearancePanel } from './AppearancePanel';
import { useThemeStore } from '../../../stores/useThemeStore';

describe('AppearancePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setTheme('dark');
  });

  test('changes the application theme immediately and persists the preference', () => {
    render(<AppearancePanel />);

    fireEvent.click(screen.getByRole('switch', { name: /dark mode/i }));

    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('40labs_theme')).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(screen.getByRole('switch', { name: /light mode/i })).not.toBeChecked();
  });
});
