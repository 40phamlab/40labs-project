import { create } from 'zustand';

export type ContextMenuTargetType = 'global' | 'text' | 'editable' | 'chat' | 'message' | 'row';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetType: ContextMenuTargetType;
  targetId?: string;
  meta?: Record<string, unknown>;
  openMenu: (payload: {
    x: number;
    y: number;
    targetType: ContextMenuTargetType;
    targetId?: string;
    meta?: Record<string, unknown>;
  }) => void;
  closeMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  targetType: 'global',
  targetId: undefined,
  meta: undefined,
  openMenu: (payload) =>
    set({
      isOpen: true,
      x: payload.x,
      y: payload.y,
      targetType: payload.targetType,
      targetId: payload.targetId,
      meta: payload.meta,
    }),
  closeMenu: () => set({ isOpen: false }),
}));
