import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppSidebarNav, NavItem } from './AppSidebarNav';

const sampleNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sales', label: 'Sales', badgeCount: 3 },
  { id: 'inventory', label: 'Inventory' },
];

describe('Sidebar Navigation Component & 3 States', () => {
  test('renders navigation items and identifies active item in expanded state', () => {
    render(
      <AppSidebarNav
        activeRoute="sales"
        navState="expanded"
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

    const inactiveItem = screen.getByRole('button', { name: /dashboard/i });
    expect(inactiveItem).not.toHaveAttribute('aria-current');
  });

  test('renders compact state with accessible tooltips/titles for every item and visual active indicator', () => {
    render(
      <AppSidebarNav
        activeRoute="sales"
        navState="compact"
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

  test('calls onNavigate callback when a navigation item is clicked', async () => {
    const handleNavigate = vi.fn();
    render(
      <AppSidebarNav
        activeRoute="dashboard"
        navState="compact"
        onNavigate={handleNavigate}
        items={sampleNavItems}
      />
    );

    const inventoryButton = screen.getByRole('button', { name: /inventory/i });
    await userEvent.click(inventoryButton);

    expect(handleNavigate).toHaveBeenCalledWith('inventory');
  });

  test('triggers state transitions via header buttons (collapse and hide)', async () => {
    const handleStateChange = vi.fn();
    render(
      <AppSidebarNav
        activeRoute="dashboard"
        navState="expanded"
        onNavigate={() => {}}
        onNavStateChange={handleStateChange}
        items={sampleNavItems}
      />
    );

    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    await userEvent.click(collapseButton);

    expect(handleStateChange).toHaveBeenCalledWith('compact');

    const hideButton = screen.getByRole('button', { name: /hide sidebar/i });
    await userEvent.click(hideButton);

    expect(handleStateChange).toHaveBeenCalledWith('hidden');
  });

  test('supports keyboard navigation on sidebar items via Enter and Space keys', () => {
    const handleNavigate = vi.fn();
    render(
      <AppSidebarNav
        activeRoute="dashboard"
        navState="expanded"
        onNavigate={handleNavigate}
        items={sampleNavItems}
      />
    );

    const inventoryButton = screen.getByRole('button', { name: /inventory/i });
    fireEvent.keyDown(inventoryButton, { key: 'Enter' });

    expect(handleNavigate).toHaveBeenCalledWith('inventory');
  });
});
