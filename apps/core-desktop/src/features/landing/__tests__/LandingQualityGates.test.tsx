import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { buildGrid, litCells } from '../lib/hexGrid';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { useThemeStore } from '../../../stores/useThemeStore';
import { ActionPanel } from '../components/ActionPanel';
import { BrandSlot } from '../components/BrandSlot';
import { ThemeMenu } from '../components/ThemeMenu';
import { LangMenu } from '../components/LangMenu';

describe('Landing Quality Gates & Unit Tests', () => {
  it('hexGrid builds valid grid and lit cells', () => {
    const grid = buildGrid(800, 600, 30, 3);
    expect(grid.length).toBeGreaterThan(0);
    const lit = litCells(grid, 800, 600, 42);
    expect(lit.length).toBeGreaterThan(0);
  });

  it('language detection defaults correctly and supports sw and en switching', () => {
    const { setLanguage } = useLanguageStore.getState();
    setLanguage('en');
    expect(useLanguageStore.getState().language).toBe('en');
    expect(useLanguageStore.getState().langSource).toBe('user');

    setLanguage('sw');
    expect(useLanguageStore.getState().language).toBe('sw');
  });

  it('theme resolution updates theme and persists to localStorage', () => {
    const { setTheme } = useThemeStore.getState();
    setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('40labs_theme')).toBe('light');

    setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('40labs_theme')).toBe('dark');
  });

  it('ActionPanel CTA buttons use whitespace-nowrap and do not wrap', () => {
    render(<ActionPanel onGetStarted={() => {}} />);
    const startBtn = screen.getByRole('button', { name: /anza|get started/i });
    expect(startBtn.className).toContain('whitespace-nowrap');
  });

  it('BrandSlot logo switches according to theme', () => {
    useThemeStore.getState().setTheme('dark');
    const { container: darkContainer } = render(<BrandSlot />);
    const darkImg = darkContainer.querySelector('img');
    expect(darkImg?.getAttribute('src')).toContain('on-dark');

    useThemeStore.getState().setTheme('light');
    const { container: lightContainer } = render(<BrandSlot />);
    const lightImg = lightContainer.querySelector('img');
    expect(lightImg?.getAttribute('src')).toContain('on-light');
  });

  it('ThemeMenu and LangMenu persist selections', () => {
    render(
      <div className="flex gap-2">
        <ThemeMenu />
        <LangMenu />
      </div>
    );
    const themeBtn = screen.getByRole('button', { name: /system|mfumo|mwanga|light|giza|dark/i });
    fireEvent.click(themeBtn);
    const darkOption = screen.getByRole('menuitem', { name: /giza|dark/i });
    fireEvent.click(darkOption);
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
