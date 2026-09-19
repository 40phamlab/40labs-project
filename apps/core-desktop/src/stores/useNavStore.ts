import { create } from 'zustand';

/**
 * Screen identifiers for the main navigation rail.
 * [PHASE: MVP] Only 'sales' and 'inventory' are currently fully functional.
 */
export type ScreenId =
  | 'dashboard'
  | 'sales'
  | 'inventory'
  | 'customers'
  | 'purchases'
  | 'settings'
  | 'scheduling'
  | 'e-pharmacy'
  | 'reports'
  | 'education'
  | 'notifications';

interface NavState {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeScreen: 'dashboard',
  setActiveScreen: (screen) => set({ activeScreen: screen }),
}));
