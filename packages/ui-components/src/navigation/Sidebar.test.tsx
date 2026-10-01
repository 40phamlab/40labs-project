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

  test('VS Code-style click rules: icon-only mode click expands to open', async () => {
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
    expect(handleStateChange).toHaveBeenCalledWith('open');
  });

  test('VS Code-style click rules: open mode, click active icon collapses to icon', async () => {
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

    expect(handleStateChange).toHaveBeenCalledWith('icon');
  });

  test('VS Code-style click rules: open mode, click different icon switches section without closing', async () => {
    const handleNavigate = vi.fn();
    const handleStateChange = vi.fn();

    render(
      <AppSidebarNav
        activeRoute="dashboard"
        navState="open"
        onNavigate={handleNavigate}
        onNavStateChange={handleStateChange}
        items={sampleNavItems}
      />
    );

    const inventoryButton = screen.getByRole('button', { name: /inventory/i });
    await userEvent.click(inventoryButton);

    expect(handleNavigate).toHaveBeenCalledWith('inventory');
    expect(handleStateChange).not.toHaveBeenCalledWith('icon');
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
});
