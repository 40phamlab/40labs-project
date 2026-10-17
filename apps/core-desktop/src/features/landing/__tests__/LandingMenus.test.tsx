import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeMenu } from '../components/ThemeMenu';
import { LangMenu } from '../components/LangMenu';
import { useThemeStore } from '../../../stores/useThemeStore';
import { useLanguageStore } from '../../../stores/useLanguageStore';

describe('Landing Dropdown Menus', () => {
  it('ThemeMenu updates theme when selected', () => {
    render(<ThemeMenu />);
    const trigger = screen.getByRole('button', { name: /system|mfumo|mwanga|light|giza|dark/i });
    expect(trigger).toBeDefined();

    fireEvent.click(trigger);

    const lightOption = screen.getByRole('menuitem', { name: /mwanga|light/i });
    fireEvent.click(lightOption);

    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('LangMenu updates language and sets langSource = user when selected', () => {
    render(<LangMenu />);
    const trigger = screen.getByRole('button', { name: /sw|en/i });
    expect(trigger).toBeDefined();

    fireEvent.click(trigger);

    const enOption = screen.getByRole('menuitem', { name: /english/i });
    fireEvent.click(enOption);

    const langState = useLanguageStore.getState();
    expect(langState.language).toBe('en');
    expect(langState.langSource).toBe('user');
  });
});
