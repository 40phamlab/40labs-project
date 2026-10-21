import { create } from 'zustand';

const STORAGE_KEY_SOUND = '40labs_sound';
const STORAGE_KEY_SETTINGS = '40labs_alert_settings';

interface AlertSettings {
  soundEnabled: boolean;
  soundRepeatIntervalMin: number;
  repeatCritical: boolean;
  repeatDanger: boolean;
  repeatWarning: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  ruleToggles: Record<string, boolean>;
  thresholdOverrides: Record<string, number>;
}

interface SettingsState extends AlertSettings {
  setSoundEnabled: (enabled: boolean) => void;
  toggleSoundEnabled: () => void;
  updateAlertSettings: (partial: Partial<AlertSettings>) => void;
}

const defaultSettings: AlertSettings = {
  soundEnabled: true,
  soundRepeatIntervalMin: 15,
  repeatCritical: true,
  repeatDanger: false,
  repeatWarning: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
  ruleToggles: {},
  thresholdOverrides: {},
};

const getInitialSettings = (): AlertSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
    const legacySound = localStorage.getItem(STORAGE_KEY_SOUND);
    if (legacySound !== null) {
      return { ...defaultSettings, soundEnabled: legacySound !== 'false' };
    }
  } catch (e) {
    // fallback
  }
  return defaultSettings;
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = getInitialSettings();

  const persist = (state: AlertSettings) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEY_SOUND, String(state.soundEnabled));
    }
  };

  return {
    ...initial,
    setSoundEnabled: (enabled: boolean) => {
      set((state) => {
        const next = { ...state, soundEnabled: enabled };
        persist(next);
        return next;
      });
    },
    toggleSoundEnabled: () => {
      const current = get().soundEnabled;
      get().setSoundEnabled(!current);
    },
    updateAlertSettings: (partial: Partial<AlertSettings>) => {
      set((state) => {
        const next = { ...state, ...partial };
        persist(next);
        return next;
      });
    },
  };
});
