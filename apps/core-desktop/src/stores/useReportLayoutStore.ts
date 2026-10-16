import { create } from 'zustand';

export type PageSize = 'A4' | 'Letter' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';
export type PageMargin = 'compact' | 'normal' | 'wide';
export type PaperTheme = 'white' | 'warm' | 'cool' | 'slate' | 'dark';
export type TableStyle = 'minimal' | 'striped' | 'bordered' | 'compact';
export type ChartColorTheme = 'teal' | 'blue' | 'emerald' | 'indigo' | 'amber' | 'slate';
export type TypographyFamily = 'sans' | 'serif' | 'mono';
export type TypographySize = 'sm' | 'base' | 'lg';
export type LogoPosition = 'left' | 'center' | 'right' | 'none';
export type HeaderAlign = 'left' | 'center' | 'right';

export interface ReportLayoutConfig {
  pageSize: PageSize;
  orientation: PageOrientation;
  margin: PageMargin;
  paperTheme: PaperTheme;
  tableStyle: TableStyle;
  chartTheme: ChartColorTheme;
  fontFamily: TypographyFamily;
  fontSize: TypographySize;
  headerTitle: string;
  headerSubtitle: string;
  headerAlign: HeaderAlign;
  footerText: string;
  showPageNumbers: boolean;
  showGeneratedDate: boolean;
  showExecutiveSummary: boolean;
  showKpis: boolean;
  showCharts: boolean;
  showTables: boolean;
  watermarkText: string;
  logoPosition: LogoPosition;
}

export interface ReportPreset {
  id: string;
  name: string;
  config: ReportLayoutConfig;
}

export const DEFAULT_REPORT_LAYOUT: ReportLayoutConfig = {
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 'normal',
  paperTheme: 'white',
  tableStyle: 'striped',
  chartTheme: 'teal',
  fontFamily: 'sans',
  fontSize: 'base',
  headerTitle: '',
  headerSubtitle: '',
  headerAlign: 'left',
  footerText: 'Confidential Internal Report — For Official Business Use Only',
  showPageNumbers: true,
  showGeneratedDate: true,
  showExecutiveSummary: true,
  showKpis: true,
  showCharts: true,
  showTables: true,
  watermarkText: '',
  logoPosition: 'left',
};

export const DEFAULT_PRESETS: ReportPreset[] = [
  {
    id: 'corporate_standard',
    name: 'Corporate Standard',
    config: { ...DEFAULT_REPORT_LAYOUT },
  },
  {
    id: 'executive_summary',
    name: 'Executive Board Summary',
    config: {
      ...DEFAULT_REPORT_LAYOUT,
      pageSize: 'A4',
      orientation: 'portrait',
      margin: 'wide',
      paperTheme: 'warm',
      tableStyle: 'minimal',
      chartTheme: 'indigo',
      fontFamily: 'serif',
      fontSize: 'lg',
      watermarkText: 'CONFIDENTIAL',
      logoPosition: 'center',
      headerAlign: 'center',
    },
  },
  {
    id: 'audit_compact',
    name: 'Compact Audit & Tax Ledger',
    config: {
      ...DEFAULT_REPORT_LAYOUT,
      pageSize: 'A4',
      orientation: 'landscape',
      margin: 'compact',
      paperTheme: 'white',
      tableStyle: 'compact',
      chartTheme: 'slate',
      fontFamily: 'mono',
      fontSize: 'sm',
      showCharts: false,
      footerText: 'Official EFD/TRA Fiscal Audit Ledger',
    },
  },
  {
    id: 'draft_watermark',
    name: 'Draft Review Copy',
    config: {
      ...DEFAULT_REPORT_LAYOUT,
      paperTheme: 'cool',
      watermarkText: 'DRAFT',
      tableStyle: 'bordered',
      chartTheme: 'amber',
    },
  },
];

const STORAGE_KEY = '40labs_report_layout_config';
const PRESETS_STORAGE_KEY = '40labs_report_layout_presets';

function loadInitialConfig(): ReportLayoutConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_REPORT_LAYOUT, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load saved report layout config:', e);
  }
  return { ...DEFAULT_REPORT_LAYOUT };
}

function loadInitialPresets(): ReportPreset[] {
  try {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load saved report presets:', e);
  }
  return DEFAULT_PRESETS;
}

interface ReportLayoutState {
  config: ReportLayoutConfig;
  presets: ReportPreset[];
  activePresetId: string;

  updateConfig: (patch: Partial<ReportLayoutConfig>) => void;
  resetConfig: () => void;
  applyPreset: (presetId: string) => void;
  saveCustomPreset: (name: string) => void;
  deleteCustomPreset: (presetId: string) => void;
}

export const useReportLayoutStore = create<ReportLayoutState>((set, get) => ({
  config: loadInitialConfig(),
  presets: loadInitialPresets(),
  activePresetId: 'corporate_standard',

  updateConfig: (patch) => {
    set((state) => {
      const newConfig = { ...state.config, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      } catch (e) {
        console.error('Failed to persist report layout config:', e);
      }
      return { config: newConfig };
    });
  },

  resetConfig: () => {
    set({ config: { ...DEFAULT_REPORT_LAYOUT }, activePresetId: 'corporate_standard' });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REPORT_LAYOUT));
    } catch (e) {
      console.error('Failed to reset report layout config:', e);
    }
  },

  applyPreset: (presetId) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (!preset) return;
    set({ config: { ...preset.config }, activePresetId: presetId });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset.config));
    } catch (e) {
      console.error('Failed to persist applied preset config:', e);
    }
  },

  saveCustomPreset: (name) => {
    const newPreset: ReportPreset = {
      id: `preset_${Date.now()}`,
      name: name.trim() || `Custom Preset ${get().presets.length + 1}`,
      config: { ...get().config },
    };
    set((state) => {
      const updatedPresets = [...state.presets, newPreset];
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
      } catch (e) {
        console.error('Failed to save preset:', e);
      }
      return { presets: updatedPresets, activePresetId: newPreset.id };
    });
  },

  deleteCustomPreset: (presetId) => {
    // Prevent deleting default built-in presets
    if (DEFAULT_PRESETS.some((p) => p.id === presetId)) return;
    set((state) => {
      const updatedPresets = state.presets.filter((p) => p.id !== presetId);
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
      } catch (e) {
        console.error('Failed to delete preset:', e);
      }
      return { presets: updatedPresets, activePresetId: 'corporate_standard' };
    });
  },
}));
