import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CHART_TYPE, DEFAULT_TIME_RANGE, ChartType, TimeRange } from '@40labs/types';

interface ChartPrefsState {
  prefs: Record<string, { chartType: ChartType; range: TimeRange }>;
  setChartType: (scopeKey: string, chartType: ChartType) => void;
  setRange: (scopeKey: string, range: TimeRange) => void;
}

export const useChartPrefsStore = create<ChartPrefsState>()(
  persist(
    (set) => ({
      prefs: {},
      setChartType: (scopeKey, chartType) =>
        set((state) => ({
          prefs: {
            ...state.prefs,
            [scopeKey]: {
              chartType,
              range: state.prefs[scopeKey]?.range || DEFAULT_TIME_RANGE,
            },
          },
        })),
      setRange: (scopeKey, range) =>
        set((state) => ({
          prefs: {
            ...state.prefs,
            [scopeKey]: {
              chartType: state.prefs[scopeKey]?.chartType || DEFAULT_CHART_TYPE,
              range,
            },
          },
        })),
    }),
    { name: '40labs_chart_prefs' }
  )
);

export function useChartPrefs(scopeKey: string) {
  const store = useChartPrefsStore();
  const current = store.prefs[scopeKey] || { chartType: DEFAULT_CHART_TYPE, range: DEFAULT_TIME_RANGE };
  return {
    chartType: current.chartType,
    range: current.range,
    setChartType: (type: ChartType) => store.setChartType(scopeKey, type),
    setRange: (range: TimeRange) => store.setRange(scopeKey, range),
  };
}
