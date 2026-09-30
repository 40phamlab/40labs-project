import { create } from 'zustand';
import type { NavigationState } from '@40labs/ui-components';

/**
 * Screen identifiers for the main navigation rail.
 */
export type ScreenId =
  | 'dashboard'
  | 'sales'
  | 'inventory'
  | 'customers'
  | 'purchases'
  | 'lab'
  | 'settings'
  | 'scheduling'
  | 'e-pharmacy'
  | 'reports'
  | 'education'
  | 'notifications';

interface NavState {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  sidebarState: NavigationState;
  setSidebarState: (state: NavigationState) => void;
  lastVisibleState: 'expanded' | 'compact';
  toggleSidebar: () => void;
}

export const useNavStore = create<NavState>((set, get) => ({
  activeScreen: 'settings',
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  sidebarState: 'expanded',
  lastVisibleState: 'expanded',
  setSidebarState: (state) =>
    set((s) => ({
      sidebarState: state,
      lastVisibleState: state !== 'hidden' ? state : s.lastVisibleState,
    })),
  toggleSidebar: () => {
    const { sidebarState, lastVisibleState } = get();
    if (sidebarState === 'hidden') {
      set({ sidebarState: lastVisibleState });
    } else if (sidebarState === 'expanded') {
      set({ sidebarState: 'compact', lastVisibleState: 'compact' });
    } else {
      set({ sidebarState: 'hidden' });
    }
  },
}));
