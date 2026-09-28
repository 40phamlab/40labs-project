import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';
import { PageViewport } from './PageViewport';
import { PageHeader } from './PageHeader';
import { PageContent } from './PageContent';
import { AppSidebarNav, NavItem } from '../navigation/AppSidebarNav';

const sampleNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sales', label: 'Sales', badgeCount: 3 },
  { id: 'inventory', label: 'Inventory' },
];

describe('AppShell Layout Component & 3-State Navigation', () => {
  test('renders AppShell with topBar, sidebar, and main workspace in default expanded state', () => {
    render(
      <AppShell
        topBar={<div data-testid="top-bar">40Labs Header</div>}
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={() => {}}
            items={sampleNavItems}
          />
        }
      >
        <div data-testid="main-content">Active Workspace Screen</div>
      </AppShell>
    );

    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    expect(sidebarContainer).toHaveClass('w-60');
    expect(sidebarContainer).not.toHaveClass('w-0');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('renders compact state with icon rail width', () => {
    render(
      <AppShell
        navState="compact"
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={() => {}}
            items={sampleNavItems}
          />
        }
      >
        <div data-testid="main-content">Workspace Content</div>
      </AppShell>
    );

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    expect(sidebarContainer).toHaveClass('w-16');
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  test('renders hidden state, hides sidebar, and provides persistent reopen button', async () => {
    const handleStateChange = vi.fn();
    render(
      <AppShell
        navState="hidden"
        onNavStateChange={handleStateChange}
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={() => {}}
            items={sampleNavItems}
          />
        }
      >
        <div data-testid="main-content">Expanded Workspace</div>
      </AppShell>
    );

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    expect(sidebarContainer).toHaveClass('w-0');
    expect(sidebarContainer).toHaveAttribute('aria-hidden', 'true');

    // Reopen button must be rendered
    const reopenButton = screen.getByRole('button', { name: /reopen navigation sidebar/i });
    expect(reopenButton).toBeInTheDocument();

    await userEvent.click(reopenButton);
    expect(handleStateChange).toHaveBeenCalledWith('expanded');
  });

  test('reopens hidden sidebar restoring previous visible state (compact)', async () => {
    function TestShellHarness() {
      const [navState, setNavState] = React.useState<'expanded' | 'compact' | 'hidden'>('compact');
      return (
        <AppShell
          navState={navState}
          onNavStateChange={setNavState}
          sidebar={
            <AppSidebarNav
              activeRoute="dashboard"
              onNavigate={() => {}}
              items={sampleNavItems}
            />
          }
        >
          <div data-testid="main-workspace">Workspace Stage</div>
        </AppShell>
      );
    }

    render(<TestShellHarness />);

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    expect(sidebarContainer).toHaveClass('w-16');

    // Hide sidebar using header button
    const hideButton = screen.getByRole('button', { name: /hide sidebar/i });
    await userEvent.click(hideButton);

    expect(sidebarContainer).toHaveClass('w-0');

    // Reopen sidebar
    const reopenButton = screen.getByRole('button', { name: /reopen navigation sidebar/i });
    await userEvent.click(reopenButton);

    // Should restore previous state ('compact')
    expect(sidebarContainer).toHaveClass('w-16');
  });

  test('toggles sidebar state via keyboard hotkey Ctrl+B', () => {
    function TestHotkeyHarness() {
      const [navState, setNavState] = React.useState<'expanded' | 'compact' | 'hidden'>('expanded');
      return (
        <AppShell
          navState={navState}
          onNavStateChange={setNavState}
          sidebar={
            <AppSidebarNav
              activeRoute="dashboard"
              onNavigate={() => {}}
              items={sampleNavItems}
            />
          }
        >
          <div>Content</div>
        </AppShell>
      );
    }

    render(<TestHotkeyHarness />);

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    expect(sidebarContainer).toHaveClass('w-60');

    // Press Ctrl+B to hide
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebarContainer).toHaveClass('w-0');

    // Press Ctrl+B to reopen
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebarContainer).toHaveClass('w-60');
  });

  test('renders PageViewport, PageHeader, and PageContent structure inside main workspace', () => {
    render(
      <PageViewport>
        <PageHeader
          title="Inventory Management"
          subtitle="Manage stock items"
          actions={<button>Add Item</button>}
        />
        <PageContent>
          <div>Table or list content</div>
        </PageContent>
      </PageViewport>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /inventory management/i })).toBeInTheDocument();
    expect(screen.getByText('Manage stock items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByText('Table or list content')).toBeInTheDocument();
  });
});
