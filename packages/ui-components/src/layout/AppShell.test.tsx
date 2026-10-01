import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell, useAppShell } from './AppShell';
import { PageViewport } from './PageViewport';
import { PageHeader } from './PageHeader';
import { PageContent } from './PageContent';
import { AppSidebarNav, NavItem } from '../navigation/AppSidebarNav';
import { TopMenuBar } from '../navigation/TopMenuBar';

const sampleNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sales', label: 'Sales', badgeCount: 3 },
  { id: 'inventory', label: 'Inventory' },
];

describe('AppShell Layout Component & 3-State Navigation', () => {
  test('renders AppShell with topBar, sidebar, and main workspace in default open state', () => {
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

  test('renders icon-only state with icon rail width', () => {
    render(
      <AppShell
        navState="icon"
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

  test('renders closed state, hides sidebar, and does not render reopen button by default unless showReopenControl is true', async () => {
    const { rerender } = render(
      <AppShell
        navState="closed"
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={() => {}}
            items={sampleNavItems}
          />
        }
      >
        <div data-testid="main-content">Workspace</div>
      </AppShell>
    );

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    expect(sidebarContainer).toHaveClass('w-0');
    expect(sidebarContainer).toHaveAttribute('aria-hidden', 'true');

    // Reopen button must not be rendered by default
    expect(screen.queryByRole('button', { name: /reopen navigation sidebar/i })).not.toBeInTheDocument();

    // Rerender with showReopenControl={true}
    rerender(
      <AppShell
        navState="closed"
        showReopenControl={true}
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={() => {}}
            items={sampleNavItems}
          />
        }
      >
        <div data-testid="main-content">Workspace</div>
      </AppShell>
    );

    const reopenButton = screen.getByRole('button', { name: /reopen navigation sidebar/i });
    expect(reopenButton).toBeInTheDocument();
  });

  test('toggles sidebar open -> closed -> open', async () => {
    function ToggleTestHarness() {
      const shell = useAppShell();
      return (
        <div>
          <button onClick={shell.toggleSidebar} data-testid="toggle-btn">Toggle</button>
          <div data-testid="nav-state">{shell.navState}</div>
        </div>
      );
    }

    render(
      <AppShell
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={() => {}}
            items={sampleNavItems}
          />
        }
      >
        <ToggleTestHarness />
      </AppShell>
    );

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    const toggleBtn = screen.getByTestId('toggle-btn');
    const navStateEl = screen.getByTestId('nav-state');

    expect(navStateEl).toHaveTextContent('open');
    expect(sidebarContainer).toHaveClass('w-60');

    // Toggle to closed
    await userEvent.click(toggleBtn);
    expect(navStateEl).toHaveTextContent('closed');
    expect(sidebarContainer).toHaveClass('w-0');

    // Toggle back to open
    await userEvent.click(toggleBtn);
    expect(navStateEl).toHaveTextContent('open');
    expect(sidebarContainer).toHaveClass('w-60');
  });

  test('toggles sidebar state via keyboard hotkey Ctrl+B (open -> closed -> open)', () => {
    function TestHotkeyHarness() {
      const [navState, setNavState] = React.useState<'closed' | 'icon' | 'open'>('open');
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

    // Press Ctrl+B to close
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebarContainer).toHaveClass('w-0');

    // Press Ctrl+B to reopen (open)
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

  test('allows natural shrinking without hard minWidth constraints by default, and respects custom minWidth/minHeight when provided', () => {
    const { container, rerender } = render(
      <AppShell>
        <div>Workspace Content</div>
      </AppShell>
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement.style.minWidth).toBe('');
    expect(rootElement.style.minHeight).toBe('');

    rerender(
      <AppShell minWidth={800} minHeight={500}>
        <div>Workspace Content</div>
      </AppShell>
    );
    expect(rootElement.style.minWidth).toBe('800px');
    expect(rootElement.style.minHeight).toBe('500px');
  });

  test('hovering items never changes sidebar state', () => {
    const handleNavStateChange = vi.fn();
    render(
      <AppShell
        navState="icon"
        onNavStateChange={handleNavStateChange}
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

    const item = screen.getByRole('button', { name: /sales/i });
    fireEvent.mouseEnter(item);
    fireEvent.mouseOver(item);
    expect(handleNavStateChange).not.toHaveBeenCalled();
  });

  test('closed state does not reopen from hover or mouse movement', () => {
    const handleNavStateChange = vi.fn();
    render(
      <AppShell
        navState="closed"
        onNavStateChange={handleNavStateChange}
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

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    fireEvent.mouseEnter(sidebarContainer);
    fireEvent.mouseMove(sidebarContainer);
    expect(handleNavStateChange).not.toHaveBeenCalled();
  });

  test('reopening restores the previous non-closed state (icon -> closed -> icon)', () => {
    function ReopenTestHarness() {
      const shell = useAppShell();
      return (
        <div>
          <button onClick={() => shell.setNavState('icon')} data-testid="set-icon">Set Icon</button>
          <button onClick={shell.toggleSidebar} data-testid="toggle">Toggle</button>
          <button onClick={shell.reopenSidebar} data-testid="reopen">Reopen</button>
          <div data-testid="nav-state">{shell.navState}</div>
        </div>
      );
    }

    render(
      <AppShell
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={() => {}}
            items={sampleNavItems}
          />
        }
      >
        <ReopenTestHarness />
      </AppShell>
    );

    // Set to icon
    fireEvent.click(screen.getByTestId('set-icon'));
    expect(screen.getByTestId('nav-state')).toHaveTextContent('icon');

    // Close
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('nav-state')).toHaveTextContent('closed');

    // Reopen restores icon
    fireEvent.click(screen.getByTestId('reopen'));
    expect(screen.getByTestId('nav-state')).toHaveTextContent('icon');
  });

  test('active implementation uses only open, icon, closed states and rejects legacy vocabularies', () => {
    render(
      <AppShell
        navState="open"
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

    const sidebarContainer = screen.getByTestId('app-shell-sidebar-container');
    expect(sidebarContainer).toHaveClass('w-60');
  });

  test('window controls and interactive chrome elements are non-draggable (no-drag)', () => {
    render(
      <div data-testid="titlebar-controls" className="no-drag">
        <button>Minimize</button>
      </div>
    );
    const controls = screen.getByTestId('titlebar-controls');
    expect(controls).toHaveClass('no-drag');
  });

  test('regression: OPEN → ICON → CLOSED → ICON cycle', async () => {
    function Harness() {
      const [navState, setNavState] = React.useState<NavigationState>('open');
      const [lastNonClosed, setLastNonClosed] = React.useState<'icon' | 'open'>('open');

      return (
        <AppShell
          navState={navState}
          lastNonClosedState={lastNonClosed}
          onNavStateChange={(state) => {
            setNavState(state);
            if (state !== 'closed') setLastNonClosed(state);
          }}
          topBar={<TopMenuBar />}
          sidebar={
            <AppSidebarNav
              activeRoute="dashboard"
              onNavigate={() => {}}
              items={sampleNavItems}
            />
          }
        >
          <div data-testid="nav-state">{navState}</div>
        </AppShell>
      );
    }

    render(<Harness />);
    const navStateEl = screen.getByTestId('nav-state');
    expect(navStateEl).toHaveTextContent('open');

    // Click active dashboard item while open -> collapses to icon
    await userEvent.click(screen.getByRole('button', { name: /^dashboard$/i }));
    expect(navStateEl).toHaveTextContent('icon');

    // Toggle via top menu -> closed
    await userEvent.click(screen.getByRole('button', { name: /toggle sidebar navigation/i }));
    expect(navStateEl).toHaveTextContent('closed');

    // Toggle via top menu -> reopens as icon (not open)
    await userEvent.click(screen.getByRole('button', { name: /show sidebar navigation/i }));
    expect(navStateEl).toHaveTextContent('icon');
  });

  test('regression: OPEN → CLOSED → OPEN cycle', async () => {
    function Harness() {
      const [navState, setNavState] = React.useState<NavigationState>('open');
      const [lastNonClosed, setLastNonClosed] = React.useState<'icon' | 'open'>('open');

      return (
        <AppShell
          navState={navState}
          lastNonClosedState={lastNonClosed}
          onNavStateChange={(state) => {
            setNavState(state);
            if (state !== 'closed') setLastNonClosed(state);
          }}
          topBar={<TopMenuBar />}
          sidebar={
            <AppSidebarNav
              activeRoute="dashboard"
              onNavigate={() => {}}
              items={sampleNavItems}
            />
          }
        >
          <div data-testid="nav-state">{navState}</div>
        </AppShell>
      );
    }

    render(<Harness />);
    const navStateEl = screen.getByTestId('nav-state');
    expect(navStateEl).toHaveTextContent('open');

    // Toggle via top menu -> closed
    await userEvent.click(screen.getByRole('button', { name: /toggle sidebar navigation/i }));
    expect(navStateEl).toHaveTextContent('closed');

    // Toggle via top menu -> reopens as open
    await userEvent.click(screen.getByRole('button', { name: /show sidebar navigation/i }));
    expect(navStateEl).toHaveTextContent('open');
  });

  test('clicking different navigation items while ICON keeps sidebar in ICON state and navigates', async () => {
    const handleNavigate = vi.fn();
    render(
      <AppShell
        navState="icon"
        sidebar={
          <AppSidebarNav
            activeRoute="dashboard"
            onNavigate={handleNavigate}
            items={sampleNavItems}
          />
        }
      >
        <div>Content</div>
      </AppShell>
    );

    const salesBtn = screen.getByRole('button', { name: /sales/i });
    await userEvent.click(salesBtn);
    expect(handleNavigate).toHaveBeenCalledWith('sales');
    expect(screen.getByTestId('app-shell-sidebar-container')).toHaveClass('w-16');
  });
});
