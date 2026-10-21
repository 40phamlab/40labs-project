// [phase: 6D] Settings Alerts Panel with title-only labels
import * as React from 'react';
import { useSettingsStore } from '../../../stores/useSettingsStore';

export const AlertsPanel: React.FC = () => {
  const {
    soundEnabled,
    setSoundEnabled,
    soundRepeatIntervalMin,
    repeatCritical,
    repeatDanger,
    repeatWarning,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    updateAlertSettings,
  } = useSettingsStore();

  return (
    <div className="flex flex-col gap-6 max-w-2xl pb-8">
      <div className="rounded-card text-text overflow-hidden bg-panel elevation-raised p-6 space-y-6">
        {/* Master Sound Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Master Sound</span>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-4 h-4 accent-action-primary cursor-pointer"
          />
        </div>

        {/* Repeat Interval */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Repeat Interval</span>
          <select
            value={soundRepeatIntervalMin}
            onChange={(e) => updateAlertSettings({ soundRepeatIntervalMin: Number(e.target.value) })}
            className="px-3 py-1.5 rounded-input bg-surface-secondary text-text text-xs border border-border"
          >
            <option value={5}>5 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
          </select>
        </div>

        {/* Repeat For: Critical */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Repeat Critical</span>
          <input
            type="checkbox"
            checked={repeatCritical}
            onChange={(e) => updateAlertSettings({ repeatCritical: e.target.checked })}
            className="w-4 h-4 accent-action-primary cursor-pointer"
          />
        </div>

        {/* Repeat For: Danger */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Repeat Danger</span>
          <input
            type="checkbox"
            checked={repeatDanger}
            onChange={(e) => updateAlertSettings({ repeatDanger: e.target.checked })}
            className="w-4 h-4 accent-action-primary cursor-pointer"
          />
        </div>

        {/* Repeat For: Warning */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Repeat Warning</span>
          <input
            type="checkbox"
            checked={repeatWarning}
            onChange={(e) => updateAlertSettings({ repeatWarning: e.target.checked })}
            className="w-4 h-4 accent-action-primary cursor-pointer"
          />
        </div>

        {/* Quiet Hours Enabled */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Quiet Hours</span>
          <input
            type="checkbox"
            checked={quietHoursEnabled}
            onChange={(e) => updateAlertSettings({ quietHoursEnabled: e.target.checked })}
            className="w-4 h-4 accent-action-primary cursor-pointer"
          />
        </div>

        {/* Quiet Hours Range */}
        {quietHoursEnabled && (
          <div className="flex items-center justify-between pl-4">
            <span className="text-sm font-bold text-text-primary">Quiet Hours Range</span>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => updateAlertSettings({ quietHoursStart: e.target.value })}
                className="px-2 py-1 rounded bg-surface-secondary text-xs text-text border border-border"
              />
              <span className="text-text-muted">-</span>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => updateAlertSettings({ quietHoursEnd: e.target.value })}
                className="px-2 py-1 rounded bg-surface-secondary text-xs text-text border border-border"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
