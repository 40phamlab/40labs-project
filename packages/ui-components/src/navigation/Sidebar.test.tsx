import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppSidebarNav, NavItem } from './AppSidebarNav';

const sampleNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sales', label: 'Sales', badgeCount: 3 },
  { id: 'inventory', label: 'Inventory' },
];

describe('Sidebar Navigation Component', () => {
  test('renders navigation items and identifies active item', () => {
    render(
      <AppSidebarNav
        activeRoute="sales"
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

  test('calls onNavigate callback when a navigation item is clicked', async () => {
    const handleNavigate = vi.fn();
    render(
      <AppSidebarNav
        activeRoute="dashboard"
        onNavigate={handleNavigate}
        items={sampleNavItems}
      />
    );

    const inventoryButton = screen.getByRole('button', { name: /inventory/i });
    await userEvent.click(inventoryButton);

    expect(handleNavigate).toHaveBeenCalledWith('inventory');
  });

  test('triggers collapse toggle when collapse button is clicked', async () => {
    const handleToggleCollapse = vi.fn();
    render(
      <AppSidebarNav
        activeRoute="dashboard"
        collapsed={false}
        onNavigate={() => {}}
        onToggleCollapse={handleToggleCollapse}
        items={sampleNavItems}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    await userEvent.click(toggleButton);

    expect(handleToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
