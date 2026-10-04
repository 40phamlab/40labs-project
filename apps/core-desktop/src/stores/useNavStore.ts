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

export const VALID_SCREENS: readonly ScreenId[] = [
  'dashboard',
  'sales',
  'inventory',
  'customers',
  'purchases',
  'lab',
  'settings',
  'scheduling',
  'e-pharmacy',
  'reports',
  'education',
  'notifications',
] as const;

const DEFAULT_SCREEN: ScreenId = 'settings';

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
  if (typeof window === 'undefined') return DEFAULT_SCREEN;
  const saved = localStorage.getItem(STORAGE_KEY_SECTION);
  if (saved && (VALID_SCREENS as readonly string[]).includes(saved)) {
    return saved as ScreenId;
  }
  return DEFAULT_SCREEN;
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
  patientDetailId: string | null;
  setPatientDetailId: (id: string | null) => void;
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
  activeScreen: getInitialSection(),
  patientDetailId: null,
  setActiveScreen: (screen) => {
    const validatedScreen = (VALID_SCREENS as readonly string[]).includes(screen)
      ? screen
      : DEFAULT_SCREEN;
    set({ activeScreen: validatedScreen, patientDetailId: null });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SECTION, validatedScreen);
    }
  },
  setPatientDetailId: (id) => set({ patientDetailId: id }),
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
        sidebar: {
          ...s.sidebar,
          expanded: state === 'open',
        },
      };
    });
  },
  toggleSidebar: () => {
    const { sidebarState, lastNonClosedState } = get();
    const newState = sidebarState === 'closed' ? lastNonClosedState : 'closed';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STATE, newState);
    }
    set({
      sidebarState: newState,
      sidebar: {
        ...get().sidebar,
        expanded: newState === 'open',
      },
    });
  },
  sidebar: {
    expanded: getInitialState() === 'open',
    setExpanded: (expanded: boolean) => {
      const newState: NavigationState = expanded ? 'open' : 'icon';
      get().setSidebarState(newState);
    },
    toggle: () => {
      const { sidebarState } = get();
      const newState: NavigationState = sidebarState === 'open' ? 'icon' : 'open';
      get().setSidebarState(newState);
    },
  },
}));
