import * as React from 'react';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t, type TranslationKey } from '@40labs/i18n';
import { authTokens } from './authTokens';

interface FeatureItem {
  key: TranslationKey;
}

const FEATURE_KEYS: FeatureItem[] = [
  { key: 'landing.slide.sell.title' },
  { key: 'landing.slide.reports.title' },
  { key: 'landing.slide.buy.title' },
  { key: 'landing.slide.grow.title' },
  { key: 'landing.slide.reach.title' },
  { key: 'landing.slide.team.title' },
];

export const FeatureStrip: React.FC = () => {
  const { language } = useLanguageStore();

  return (
    <div className="space-y-4 py-4 select-none">
      {FEATURE_KEYS.map((item, index) => {
        const title = t(item.key, language);
        return (
          <div
            key={item.key}
            className="flex items-center space-x-3 opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Small regular-hex icon */}
            <div className="w-8 h-8 shrink-0 flex items-center justify-center relative">
              <svg className="w-full h-full" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <polygon
                  points="16,2 28,9 28,23 16,30 4,23 4,9"
                  fill="none"
                  stroke={authTokens.colors.orange}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: authTokens.colors.green }}
              />
            </div>
            <span className={`text-sm font-semibold text-foreground ${authTokens.typography.heading}`}>
              {title}
            </span>
          </div>
        );
      })}
    </div>
  );
};
