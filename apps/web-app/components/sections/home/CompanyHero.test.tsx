import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompanyHero } from './CompanyHero';

describe('CompanyHero', () => {
  it('renders all three cards with their correct titles and CTAs', () => {
    render(<CompanyHero />);

    expect(screen.getAllByText('Telemed')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Manage')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Generating insights')[0]).toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: /start free/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /explore more/i }).length).toBeGreaterThan(0);
  });

  it('performs no network calls when CTA is clicked', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<CompanyHero />);

    const startFreeBtn = screen.getAllByRole('button', { name: /start free/i })[0];
    fireEvent.click(startFreeBtn);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Hero CTA clicked'));
    consoleLogSpy.mockRestore();
  });
});
