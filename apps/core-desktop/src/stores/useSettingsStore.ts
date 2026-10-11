import { create } from 'zustand';

const STORAGE_KEY_SOUND = '40labs_sound';

const getInitialSound = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY_SOUND);
  return saved !== 'false';
};

interface SettingsState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSoundEnabled: () => void;
}

// TODO: [reason: needs Settings spec entry] [phase: 9D]
export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = getInitialSound();

  return {
    soundEnabled: initial,
    setSoundEnabled: (enabled: boolean) => {
      set({ soundEnabled: enabled });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
      }
    },
    toggleSoundEnabled: () => {
      const current = get().soundEnabled;
      get().setSoundEnabled(!current);
    },
  };
});
