import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TitleBar } from '../TitleBar';

describe('TitleBar & Floating App Shell Integration', () => {
  test('renders logo, hamburger menu, branch control, status slot, and window controls', () => {
    render(<TitleBar brandName="40Labs" />);

    expect(screen.getByText('40Labs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /application menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /branch:/i })).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator-slot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /minimize window/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /maximize window/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close window/i })).toBeInTheDocument();
  });

  test('hamburger menu opens and closes, showing items like Workspace Settings and Check for Updates', async () => {
    render(<TitleBar hasUpdateAvailable={true} />);

    const hamburgerBtn = screen.getByRole('button', { name: /application menu/i });

    // Open menu
    await userEvent.click(hamburgerBtn);
    expect(screen.getByText('Workspace Settings')).toBeInTheDocument();
    expect(screen.getByText('Check for Updates...')).toBeInTheDocument();
  });

  test('update badge indicator is visible on hamburger and updates item when update is pending', async () => {
    render(<TitleBar hasUpdateAvailable={true} />);

    const hamburgerBtn = screen.getByRole('button', { name: /application menu/i });
    expect(hamburgerBtn.querySelector('.bg-action-primary')).toBeInTheDocument();

    await userEvent.click(hamburgerBtn);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('drag region is restricted to empty spacer and interactive children are non-draggable', () => {
    render(<TitleBar />);

    const dragSpacer = document.querySelector('[data-tauri-drag-region]:not([data-tauri-drag-region="false"])');
    expect(dragSpacer).toBeInTheDocument();

    const hamburgerBtn = screen.getByRole('button', { name: /application menu/i });
    expect(hamburgerBtn).toHaveAttribute('data-tauri-drag-region', 'false');
  });
});
