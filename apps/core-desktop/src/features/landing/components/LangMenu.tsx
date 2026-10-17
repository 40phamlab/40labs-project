import * as React from 'react';
import { Dropdown } from '@40labs/ui-components';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguageStore, type Lang } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

export const LangMenu: React.FC = () => {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages: { code: Lang; labelKey: 'landing.lang.sw' | 'landing.lang.en'; short: string }[] = [
    { code: 'sw', labelKey: 'landing.lang.sw', short: 'SW' },
    { code: 'en', labelKey: 'landing.lang.en', short: 'EN' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const triggerNode = (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={() => setIsOpen(!isOpen)}
      className="h-[40px] px-3 rounded-[8px] flex items-center space-x-2 bg-surface/60 backdrop-blur-md border border-border text-foreground text-sm font-medium hover:border-primary/50 hover:bg-surface/80 focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer"
    >
      <Globe size={16} className="text-text-muted" />
      <span>{currentLangObj.short}</span>
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
        {languages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              role="menuitem"
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full h-[40px] px-3 rounded-lg flex items-center justify-between text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold uppercase w-6">{lang.short}</span>
                <span>{t(lang.labelKey, language)}</span>
              </div>
              {isActive && <Check size={16} className="text-primary" />}
            </button>
          );
        })}
      </div>
    </Dropdown>
  );
};
