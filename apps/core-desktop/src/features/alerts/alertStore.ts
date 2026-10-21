import { create } from 'zustand';

interface AlertClientState {
  acknowledged: Record<string, boolean>;
  mutedUntilResolved: Record<string, boolean>;
  snoozedUntil: Record<string, number>; // timestamp ms

  acknowledge: (key: string) => void;
  mute: (key: string) => void;
  snooze: (key: string, untilMs: number) => void;
  clear: (key: string) => void;
  reset: () => void;
}

export const useAlertStore = create<AlertClientState>((set) => ({
  acknowledged: {},
  mutedUntilResolved: {},
  snoozedUntil: {},

  acknowledge: (key: string) =>
    set((state) => ({
      acknowledged: { ...state.acknowledged, [key]: true },
    })),

  mute: (key: string) =>
    set((state) => ({
      mutedUntilResolved: { ...state.mutedUntilResolved, [key]: true },
    })),

  snooze: (key: string, untilMs: number) =>
    set((state) => ({
      snoozedUntil: { ...state.snoozedUntil, [key]: untilMs },
    })),

  clear: (key: string) =>
    set((state) => {
      const ack = { ...state.acknowledged };
      const mut = { ...state.mutedUntilResolved };
      const sno = { ...state.snoozedUntil };
      delete ack[key];
      delete mut[key];
      delete sno[key];
      return { acknowledged: ack, mutedUntilResolved: mut, snoozedUntil: sno };
    }),

  reset: () => set({ acknowledged: {}, mutedUntilResolved: {}, snoozedUntil: {} }),
}));
