import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SummaryMode = 'full' | 'compact';

interface SalesUiState {
  summaryMode: SummaryMode;
  setSummaryMode: (mode: SummaryMode) => void;
  toggleSummaryMode: () => void;
}

export const useSalesUiStore = create<SalesUiState>()(
  persist(
    (set, get) => ({
      summaryMode: 'full',
      setSummaryMode: (summaryMode) => set({ summaryMode }),
      toggleSummaryMode: () => set({ summaryMode: get().summaryMode === 'full' ? 'compact' : 'full' }),
    }),
    {
      name: '40labs-sales-ui-storage',
    }
  )
);
