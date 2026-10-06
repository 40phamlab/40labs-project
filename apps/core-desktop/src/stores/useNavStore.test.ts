import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useNavStore navigation persistence and validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores correctly when a valid persisted screen is present', async () => {
    localStorage.setItem('40labs_sidebar_section', 'sales');
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().activeScreen).toBe('sales');
  });

  it('falls back to default screen when an invalid persisted screen is present', async () => {
    localStorage.setItem('40labs_sidebar_section', 'old-screen-that-no-longer-exists');
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().activeScreen).toBe('settings');
  });

  it('falls back to default screen when persisted screen is missing', async () => {
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().activeScreen).toBe('settings');
  });

  it('persists correctly upon navigation to a valid screen', async () => {
    const { useNavStore } = await import('./useNavStore');
    useNavStore.getState().setActiveScreen('reports');
    expect(useNavStore.getState().activeScreen).toBe('reports');
    expect(localStorage.getItem('40labs_sidebar_section')).toBe('reports');
  });

  it('restores valid screen correctly on application reload', async () => {
    localStorage.setItem('40labs_sidebar_section', 'customers');
    const { useNavStore: firstLoadStore } = await import('./useNavStore');
    expect(firstLoadStore.getState().activeScreen).toBe('customers');

    // Simulate reload by resetting modules and re-importing store
    vi.resetModules();
    const { useNavStore: reloadStore } = await import('./useNavStore');
    expect(reloadStore.getState().activeScreen).toBe('customers');
  });

  it('manages sidebarState and lastNonClosedState correctly', async () => {
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().sidebarState).toBe('open');
    expect(useNavStore.getState().lastNonClosedState).toBe('open');

    useNavStore.getState().setSidebarState('icon');
    expect(useNavStore.getState().sidebarState).toBe('icon');
    expect(useNavStore.getState().lastNonClosedState).toBe('icon');

    useNavStore.getState().setSidebarState('closed');
    expect(useNavStore.getState().sidebarState).toBe('closed');
    expect(useNavStore.getState().lastNonClosedState).toBe('icon'); // preserved non-closed state

    useNavStore.getState().toggleSidebar();
    expect(useNavStore.getState().sidebarState).toBe('icon'); // restores lastNonClosedState

    useNavStore.getState().toggleSidebar();
    expect(useNavStore.getState().sidebarState).toBe('closed');
  });

  it('manages sidebar.expanded UI slice correctly', async () => {
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().sidebar.expanded).toBe(true);
    expect(useNavStore.getState().sidebarState).toBe('open');

    useNavStore.getState().sidebar.setExpanded(false);
    expect(useNavStore.getState().sidebar.expanded).toBe(false);
    expect(useNavStore.getState().sidebarState).toBe('icon');

    useNavStore.getState().sidebar.toggle();
    expect(useNavStore.getState().sidebar.expanded).toBe(true);
    expect(useNavStore.getState().sidebarState).toBe('open');
  });

  it('navigating across 5+ screens in all 3 states (open, icon, closed) never changes sidebarState', async () => {
    const { useNavStore } = await import('./useNavStore');

    const screensToVisit = ['dashboard', 'sales', 'inventory', 'customers', 'purchases', 'lab'] as const;

    // Test in OPEN state
    useNavStore.getState().setSidebarState('open');
    for (const screen of screensToVisit) {
      useNavStore.getState().setActiveScreen(screen);
      expect(useNavStore.getState().activeScreen).toBe(screen);
      expect(useNavStore.getState().sidebarState).toBe('open');
    }

    // Test in ICON state
    useNavStore.getState().setSidebarState('icon');
    for (const screen of screensToVisit) {
      useNavStore.getState().setActiveScreen(screen);
      expect(useNavStore.getState().activeScreen).toBe(screen);
      expect(useNavStore.getState().sidebarState).toBe('icon');
    }

    // Test in CLOSED state
    useNavStore.getState().setSidebarState('closed');
    for (const screen of screensToVisit) {
      useNavStore.getState().setActiveScreen(screen);
      expect(useNavStore.getState().activeScreen).toBe(screen);
      expect(useNavStore.getState().sidebarState).toBe('closed');
    }

    // Restore from closed toggles to last non-closed state ('icon')
    useNavStore.getState().toggleSidebar();
    expect(useNavStore.getState().sidebarState).toBe('icon');
  });
});
