import { create } from 'zustand';
import { SERIES_BY_TAB, ReportTabId } from '../config/seriesRegistry';

export type ChartType = 'combo' | 'bar' | 'line' | 'area' | 'stacked' | 'ring';
export type Granularity = 'hour' | 'day' | 'week' | 'month';

interface ReportChartState {
  chartType: ChartType;
  granularity: Granularity;
  seriesVisibility: Record<string, boolean>;
  compare: boolean;
  activeTab: ReportTabId;

  setActiveTab: (tab: ReportTabId) => void;
  setChartType: (type: ChartType) => void;
  setGranularity: (granularity: Granularity) => void;
  toggleSeries: (key: string) => void;
  setSeriesVisible: (key: string, visible: boolean) => void;
  setCompare: (compare: boolean) => void;
  resetToDefault: (tab: ReportTabId) => void;
}

const getDefaultVisibility = (tab: ReportTabId): Record<string, boolean> => {
  const seriesList = SERIES_BY_TAB[tab] || [];
  const visibility: Record<string, boolean> = {};
  seriesList.forEach((s) => {
    visibility[s.key] = s.defaultVisible;
  });
  return visibility;
};

export const useReportChartState = create<ReportChartState>((set) => ({
  chartType: 'combo',
  granularity: 'day',
  seriesVisibility: getDefaultVisibility('sales'),
  compare: false,
  activeTab: 'sales',

  setActiveTab: (tab) =>
    set((state) => {
      if (state.activeTab === tab) return state;
      return {
        activeTab: tab,
        seriesVisibility: getDefaultVisibility(tab),
      };
    }),

  setChartType: (chartType) => set({ chartType }),

  setGranularity: (granularity) => set({ granularity }),

  toggleSeries: (key) =>
    set((state) => ({
      seriesVisibility: {
        ...state.seriesVisibility,
        [key]: !state.seriesVisibility[key],
      },
    })),

  setSeriesVisible: (key, visible) =>
    set((state) => ({
      seriesVisibility: {
        ...state.seriesVisibility,
        [key]: visible,
      },
    })),

  setCompare: (compare) => set({ compare }),

  resetToDefault: (tab) =>
    set({
      chartType: 'combo',
      granularity: 'day',
      seriesVisibility: getDefaultVisibility(tab),
      compare: false,
    }),
}));
