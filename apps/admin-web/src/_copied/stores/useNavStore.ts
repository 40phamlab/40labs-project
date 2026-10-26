// COPIED FROM: apps/core-desktop/src/stores/useNavStore.ts
import { create } from 'zustand';
import type { NavigationState } from '@40labs/ui-components';

export type ScreenId = 'overview' | 'businesses' | 'analytics' | 'sync' | 'infra' | 'account';

export const VALID_SCREENS: readonly ScreenId[] = [
  'overview',
  'businesses',
  'analytics',
  'sync',
  'infra',
  'account',
] as const;

const DEFAULT_SCREEN: ScreenId = 'overview';

interface NavState {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  sidebarState: NavigationState;
  setSidebarState: (state: NavigationState) => void;
  lastNonClosedState: 'icon' | 'open';
  toggleSidebar: () => void;
  sidebar: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
    toggle: () => void;
  };
}

export const useNavStore = create<NavState>((set, get) => ({
  activeScreen: DEFAULT_SCREEN,
  setActiveScreen: (screen) => {
    const validated = (VALID_SCREENS as readonly string[]).includes(screen) ? screen : DEFAULT_SCREEN;
    set({ activeScreen: validated });
  },
  sidebarState: 'open',
  lastNonClosedState: 'open',
  setSidebarState: (state) => set({ sidebarState: state }),
  toggleSidebar: () => {
    const s = get().sidebarState;
    set({ sidebarState: s === 'closed' ? 'open' : 'closed' });
  },
  sidebar: {
    expanded: true,
    setExpanded: (expanded) => set({ sidebarState: expanded ? 'open' : 'icon' }),
    toggle: () => {
      const s = get().sidebarState;
      set({ sidebarState: s === 'open' ? 'icon' : 'open' });
    },
  },
}));
