import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';
import { PageViewport } from './PageViewport';
import { PageHeader } from './PageHeader';
import { PageContent } from './PageContent';

describe('PageShell Layout Component', () => {
  test('renders AppShell with topBar, sidebar, and main viewport children', () => {
    render(
      <AppShell
        topBar={<div data-testid="top-bar">40Labs Header</div>}
        sidebar={<div data-testid="sidebar-nav">Nav Items</div>}
      >
        <div data-testid="main-content">Active Workspace Screen</div>
      </AppShell>
    );

    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();

    const headerEl = screen.getByRole('banner');
    const asideEl = screen.getByRole('complementary');
    const mainViewport = screen.getByTestId('main-content');

    expect(headerEl).toBeInTheDocument();
    expect(asideEl).toBeInTheDocument();
    expect(mainViewport).toBeInTheDocument();
  });

  test('renders PageViewport, PageHeader, and PageContent structure', () => {
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
