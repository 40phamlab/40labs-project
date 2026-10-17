import * as React from 'react';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

export const OfflinePill: React.FC = () => {
  const { language } = useLanguageStore();
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="h-[32px] px-3.5 rounded-full bg-surface/60 backdrop-blur-md border border-border flex items-center space-x-2 text-xs font-medium text-foreground select-none shadow-sm">
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          isOnline ? 'bg-[#16A34A] animate-pulse' : 'bg-[#F97316]'
        }`}
      />
      <span>
        {isOnline ? t('landing.offline.on', language) : t('landing.offline.off', language)}
      </span>
    </div>
  );
};
