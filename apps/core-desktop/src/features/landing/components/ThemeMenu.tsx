import * as React from 'react';
import { Dropdown } from '@40labs/ui-components';
import { Monitor, Sun, Moon, ChevronDown, Check } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '../../../stores/useThemeStore';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

export const ThemeMenu: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { language } = useLanguageStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const getIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'system':
        return <Monitor size={16} className="text-text-muted" />;
      case 'light':
        return <Sun size={16} className="text-amber-500" />;
      case 'dark':
        return <Moon size={16} className="text-indigo-400" />;
    }
  };

  const getLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'system':
        return t('landing.theme.system', language);
      case 'light':
        return t('landing.theme.light', language);
      case 'dark':
        return t('landing.theme.dark', language);
    }
  };

  const triggerNode = (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={() => setIsOpen(!isOpen)}
      className="h-[40px] px-3 rounded-[8px] flex items-center space-x-2 bg-surface/60 backdrop-blur-md border border-border text-foreground text-sm font-medium hover:border-primary/50 hover:bg-surface/80 focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer"
    >
      {getIcon(theme)}
      <span>{getLabel(theme)}</span>
      <ChevronDown size={14} className="text-text-muted ml-1" />
    </button>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={triggerNode}
      placement="bottom-end"
    >
      <div
        role="menu"
        className="w-[160px] bg-surface/90 backdrop-blur-md border border-border rounded-[12px] shadow-lg p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
      >
        {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => {
          const isActive = theme === mode;
          return (
            <button
              key={mode}
              role="menuitem"
              onClick={() => {
                setTheme(mode);
                setIsOpen(false);
              }}
              className={`w-full h-[40px] px-3 rounded-lg flex items-center justify-between text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {getIcon(mode)}
                <span>{getLabel(mode)}</span>
              </div>
              {isActive && <Check size={16} className="text-primary" />}
            </button>
          );
        })}
      </div>
    </Dropdown>
  );
};
