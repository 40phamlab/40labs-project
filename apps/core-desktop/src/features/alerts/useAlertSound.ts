// [phase: 6D] Alert Sound Hook with Repetition & Settings Integration
import * as React from 'react';
import { useAlerts } from './useAlerts';
import { useAlertStore } from './alertStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export function useAlertSound() {
  const { alerts } = useAlerts();
  const { acknowledged, mutedUntilResolved, snoozedUntil } = useAlertStore();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const soundRepeatIntervalMin = useSettingsStore((s) => s.soundRepeatIntervalMin);
  const repeatCritical = useSettingsStore((s) => s.repeatCritical);
  const quietHoursEnabled = useSettingsStore((s) => s.quietHoursEnabled);
  const quietHoursStart = useSettingsStore((s) => s.quietHoursStart);
  const quietHoursEnd = useSettingsStore((s) => s.quietHoursEnd);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const loggedAutoplayErrorRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/media/audio/notification.mp3');
      audioRef.current.preload = 'auto';
    }
  }, []);

  const playSound = React.useCallback(() => {
    if (!soundEnabled || !repeatCritical) return;

    // Check quiet hours
    if (quietHoursEnabled && quietHoursStart && quietHoursEnd) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = quietHoursStart.split(':').map(Number);
      const [endH, endM] = quietHoursEnd.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return;
      } else {
        // spans midnight
        if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) return;
      }
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        if (!loggedAutoplayErrorRef.current) {
          console.warn('Alert sound autoplay rejected by browser/webview:', err);
          loggedAutoplayErrorRef.current = true;
        }
      });
    }
  }, [soundEnabled, repeatCritical, quietHoursEnabled, quietHoursStart, quietHoursEnd]);

  // Check for unacknowledged critical alerts
  const hasActiveCritical = React.useMemo(() => {
    const nowMs = Date.now();
    return alerts.some((a) => {
      if (a.severity !== 'critical') return false;
      if (acknowledged[a.key]) return false;
      if (mutedUntilResolved[a.key]) return false;
      const snoozed = snoozedUntil[a.key];
      if (snoozed && snoozed > nowMs) return false;
      return true;
    });
  }, [alerts, acknowledged, mutedUntilResolved, snoozedUntil]);

  // Play immediately on first occurrence & repeat every interval
  React.useEffect(() => {
    if (!hasActiveCritical) return;

    playSound();

    const intervalMs = (soundRepeatIntervalMin || 15) * 60 * 1000;
    const timer = setInterval(() => {
      playSound();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasActiveCritical, soundRepeatIntervalMin, playSound]);
}
