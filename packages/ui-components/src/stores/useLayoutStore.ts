import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubNavKey = 'lab' | 'settings';

interface LayoutState {
  subNavOpen: Record<SubNavKey, boolean>;
  setSubNavOpen: (key: SubNavKey, open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      subNavOpen: { lab: true, settings: true },
      setSubNavOpen: (key, open) =>
        set((s) => ({ subNavOpen: { ...s.subNavOpen, [key]: open } })),
    }),
    { name: '40labs-layout' },
  ),
);
