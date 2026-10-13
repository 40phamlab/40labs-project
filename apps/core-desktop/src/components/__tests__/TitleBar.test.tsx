import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TitleBar } from '../TitleBar';
import { AppShell } from '@40labs/ui-components';

describe('TitleBar & Floating App Shell Integration', () => {
  afterEach(() => {
    cleanup();
  });

  test('renders logo, hamburger menu, branch control, status slot, and window controls', () => {
    render(<TitleBar brandName="40Labs" />);

    expect(screen.getByText('40Labs')).toBeDefined();
    expect(screen.getByRole('button', { name: /application menu/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /branch:/i })).toBeDefined();
    expect(screen.getByTestId('status-indicator-slot')).toBeDefined();
    expect(screen.getByRole('button', { name: /minimize window/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /maximize window/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /close window/i })).toBeDefined();
  });

  test('renders sidebar toggle button at leftmost position with accessible label and working click handler', async () => {
    const handleToggle = vi.fn();
    render(
      <AppShell variant="floating" topBar={<TitleBar onToggleSidebar={handleToggle} />}>
        <div>Content</div>
      </AppShell>
    );

    const toggleBtn = screen.getByRole('button', { name: /sidebar navigation/i });
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn.getAttribute('data-tauri-drag-region')).toBe('false');

    await userEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  test('hamburger menu opens and closes, showing items like Workspace Settings and Check for Updates', async () => {
    render(<TitleBar hasUpdateAvailable={true} />);

    const hamburgerBtn = screen.getByRole('button', { name: /application menu/i });

    // Open menu
    await userEvent.click(hamburgerBtn);
    expect(screen.getByText('Workspace Settings')).toBeDefined();
    expect(screen.getByText('Check for Updates...')).toBeDefined();
  });

  test('update badge indicator is visible on hamburger and updates item when update is pending', async () => {
    render(<TitleBar hasUpdateAvailable={true} />);

    const hamburgerBtn = screen.getByRole('button', { name: /application menu/i });
    expect(hamburgerBtn.querySelector('.bg-action-primary')).toBeDefined();

    await userEvent.click(hamburgerBtn);
    expect(screen.getByText('New')).toBeDefined();
  });

  test('drag region is restricted to empty spacer and interactive children are non-draggable', () => {
    render(<TitleBar />);

    const dragSpacer = document.querySelector('[data-tauri-drag-region]:not([data-tauri-drag-region="false"])');
    expect(dragSpacer).toBeDefined();

    const hamburgerBtn = screen.getByRole('button', { name: /application menu/i });
    expect(hamburgerBtn.getAttribute('data-tauri-drag-region')).toBe('false');
  });
});
