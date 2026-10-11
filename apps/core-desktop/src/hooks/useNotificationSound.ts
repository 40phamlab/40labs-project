import { MEDIA } from '../lib/media';
import { useSettingsStore } from '../stores/useSettingsStore';

let audioInstance: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
  try {
    audioInstance = new Audio(MEDIA.audio.notification);
    audioInstance.volume = 0.6;
  } catch {
    // Ignore audio initialization errors in unsupported environments
  }
}

export function useNotificationSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  const play = () => {
    if (!soundEnabled || !audioInstance) return;
    try {
      audioInstance.currentTime = 0;
      audioInstance.play().catch(() => {
        // Catch autoplay policy rejections gracefully
      });
    } catch {
      // Ignore audio playback errors
    }
  };

  return { play };
}
