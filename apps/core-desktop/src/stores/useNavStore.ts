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

const STORAGE_KEY_STATE = '40labs_sidebar_state';
const STORAGE_KEY_SECTION = '40labs_sidebar_section';
const STORAGE_KEY_LAST_NON_CLOSED = '40labs_sidebar_last_non_closed';

const getInitialState = (): NavigationState => {
  if (typeof window === 'undefined') return 'open';
  const saved = localStorage.getItem(STORAGE_KEY_STATE);
  if (saved === 'closed' || saved === 'icon' || saved === 'open') return saved;
  if (saved === 'expanded') return 'open';
  if (saved === 'compact') return 'icon';
  if (saved === 'hidden') return 'closed';
  return 'open';
};

const getInitialSection = (): ScreenId => {
  if (typeof window === 'undefined') return 'settings';
  return (localStorage.getItem(STORAGE_KEY_SECTION) as ScreenId) || 'settings';
};

const getInitialLastNonClosed = (): 'icon' | 'open' => {
  if (typeof window === 'undefined') return 'open';
  const saved = localStorage.getItem(STORAGE_KEY_LAST_NON_CLOSED);
  if (saved === 'icon' || saved === 'open') return saved;
  return 'open';
};

interface NavState {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  sidebarState: NavigationState;
  setSidebarState: (state: NavigationState) => void;
  lastNonClosedState: 'icon' | 'open';
  toggleSidebar: () => void;
}

export const useNavStore = create<NavState>((set, get) => ({
  activeScreen: getInitialSection(),
  setActiveScreen: (screen) => {
    set({ activeScreen: screen });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SECTION, screen);
    }
  },
  sidebarState: getInitialState(),
  lastNonClosedState: getInitialLastNonClosed(),
  setSidebarState: (state: NavigationState) => {
    set((s) => {
      const lastNonClosed = state !== 'closed' ? state : s.lastNonClosedState;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_STATE, state);
        localStorage.setItem(STORAGE_KEY_LAST_NON_CLOSED, lastNonClosed);
      }
      return {
        sidebarState: state,
        lastNonClosedState: lastNonClosed,
      };
    });
  },
  toggleSidebar: () => {
    const { sidebarState, lastNonClosedState } = get();
    const newState = sidebarState === 'closed' ? lastNonClosedState : 'closed';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STATE, newState);
    }
    set({ sidebarState: newState });
  },
}));
