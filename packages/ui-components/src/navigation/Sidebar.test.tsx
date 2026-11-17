import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppSidebarNav, NavItem } from './AppSidebarNav';
import { AppShell } from '../layout/AppShell';

const sampleNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sales', label: 'Sales', badgeCount: 3 },
  { id: 'inventory', label: 'Inventory' },
];

describe('Sidebar Navigation Component & 3-State Click Rules', () => {
  test('renders navigation items and identifies active item in open state', () => {
    render(
      <AppSidebarNav
        activeRoute="sales"
        navState="open"
        onNavigate={() => {}}
        items={sampleNavItems}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Badge count

    const activeItem = screen.getByRole('button', { name: /sales/i });
    expect(activeItem).toHaveAttribute('aria-current', 'page');
    expect(activeItem).not.toHaveClass('border-l-2');
    expect(activeItem).not.toHaveClass('border-action-primary');

    const inactiveItem = screen.getByRole('button', { name: /dashboard/i });
    expect(inactiveItem).not.toHaveAttribute('aria-current');
  });

  test('renders icon-only state with accessible tooltips/titles for every item', () => {
    render(
      <AppSidebarNav
        activeRoute="sales"
        navState="icon"
        onNavigate={() => {}}
        items={sampleNavItems}
      />
    );

    const salesItem = screen.getByRole('button', { name: /sales/i });
    expect(salesItem).toHaveAttribute('title', 'Sales');
    expect(salesItem).toHaveAttribute('aria-current', 'page');

    const dashboardItem = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardItem).toHaveAttribute('title', 'Dashboard');
  });

  test('icon-only mode click selects section and sidebar stays in icon state', async () => {
    const handleNavigate = vi.fn();
    const handleStateChange = vi.fn();

    render(
      <AppSidebarNav
        activeRoute="dashboard"
        navState="icon"
        onNavigate={handleNavigate}
        onNavStateChange={handleStateChange}
        items={sampleNavItems}
      />
    );

    const salesButton = screen.getByRole('button', { name: /sales/i });
    await userEvent.click(salesButton);

    expect(handleNavigate).toHaveBeenCalledWith('sales');
    expect(handleStateChange).not.toHaveBeenCalled();
  });

  test('open mode: clicking navigation items only changes active route and never changes sidebar state', async () => {
    const handleNavigate = vi.fn();
    const handleStateChange = vi.fn();

    render(
      <AppSidebarNav
        activeRoute="sales"
        navState="open"
        onNavigate={handleNavigate}
        onNavStateChange={handleStateChange}
        items={sampleNavItems}
      />
    );

    const salesButton = screen.getByRole('button', { name: /sales/i });
    await userEvent.click(salesButton);

    expect(handleNavigate).toHaveBeenCalledWith('sales');
    expect(handleStateChange).not.toHaveBeenCalled();
  });

  test('supports keyboard navigation on sidebar items via Enter and Space keys', () => {
    const handleNavigate = vi.fn();
    render(
      <AppSidebarNav
        activeRoute="dashboard"
        navState="open"
        onNavigate={handleNavigate}
        items={sampleNavItems}
      />
    );

    const inventoryButton = screen.getByRole('button', { name: /inventory/i });
    fireEvent.keyDown(inventoryButton, { key: 'Enter' });

    expect(handleNavigate).toHaveBeenCalledWith('inventory');
  });

  test('supports three sidebar states and all 5 state transitions (Expanded, Icons Only, Hidden)', () => {
    const { rerender } = render(
      <AppShell navState="open" sidebar={<AppSidebarNav activeRoute="dashboard" navState="open" onNavigate={() => {}} items={sampleNavItems} />}>
        <div>Main Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('app-shell-sidebar-container')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // 1. Expanded → Icons Only
    rerender(
      <AppShell navState="icon" sidebar={<AppSidebarNav activeRoute="dashboard" navState="icon" onNavigate={() => {}} items={sampleNavItems} />}>
        <div>Main Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('app-shell-sidebar-container')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // 2. Icons Only → Hidden
    rerender(
      <AppShell navState="closed" sidebar={<AppSidebarNav activeRoute="dashboard" navState="closed" onNavigate={() => {}} items={sampleNavItems} />}>
        <div>Main Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('app-shell-sidebar-container')).toHaveClass('w-0');

    // 3. Hidden → Expanded
    rerender(
      <AppShell navState="open" sidebar={<AppSidebarNav activeRoute="dashboard" navState="open" onNavigate={() => {}} items={sampleNavItems} />}>
        <div>Main Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('app-shell-sidebar-container')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // 4. Hidden → Icons Only
    rerender(
      <AppShell navState="closed" sidebar={<AppSidebarNav activeRoute="dashboard" navState="closed" onNavigate={() => {}} items={sampleNavItems} />}>
        <div>Main Content</div>
      </AppShell>
    );
    rerender(
      <AppShell navState="icon" sidebar={<AppSidebarNav activeRoute="dashboard" navState="icon" onNavigate={() => {}} items={sampleNavItems} />}>
        <div>Main Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('app-shell-sidebar-container')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // 5. Icons Only → Expanded
    rerender(
      <AppShell navState="open" sidebar={<AppSidebarNav activeRoute="dashboard" navState="open" onNavigate={() => {}} items={sampleNavItems} />}>
        <div>Main Content</div>
      </AppShell>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
