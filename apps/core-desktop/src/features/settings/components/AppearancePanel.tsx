import * as React from 'react';
import { Panel } from '@40labs/ui-components';
import type { Business } from '@40labs/types';
import type { UpdateBusinessPayload } from '../../../hooks/useBusiness';
import { useThemeStore, type ThemeMode } from '../../../stores/useThemeStore';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import type { Language } from '@40labs/i18n';

interface AppearancePanelProps {
  business?: Business | null;
  onToggle?: (payload: UpdateBusinessPayload) => Promise<void> | void;
  isLoading?: boolean;
}

export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  business: _business,
  onToggle,
  isLoading = false,
}) => {
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (onToggle) {
      await onToggle({ appearance_mode: newTheme });
    }
  };

  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    if (onToggle) {
      await onToggle({ language: newLang });
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-2xl">
      {/* Theme Section */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Theme</h3>
        </div>

        <div className="flex items-center gap-2 p-1 bg-panel-subtle rounded-card border border-border/50 max-w-md">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
            const isActive = theme === mode;
            return (
              <button
                key={mode}
                type="button"
                disabled={isLoading}
                onClick={() => handleThemeChange(mode)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium capitalize transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-focus-ring ${
                  isActive
                    ? 'bg-surface-elevated text-text-primary font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Language Section */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Language</h3>
        </div>

        <div className="flex items-center gap-2 p-1 bg-panel-subtle rounded-card border border-border/50 max-w-md">
          {[
            { id: 'sw-TZ', label: 'Kiswahili' },
            { id: 'en', label: 'English' },
          ].map((lang) => {
            const isActive = language === lang.id || (language === 'sw' && lang.id === 'sw-TZ');
            return (
              <button
                key={lang.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleLanguageChange(lang.id as Language)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-focus-ring ${
                  isActive
                    ? 'bg-surface-elevated text-text-primary font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};
