import * as React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useConnectivityStore } from '../stores/useConnectivityStore';
import { t } from '@40labs/i18n';

export const ConnectivityIndicator: React.FC = () => {
  const status = useConnectivityStore((s) => s.status);
  const isOnline = status === 'online';

  const label = isOnline ? t('connectivity.online') : t('connectivity.offline');
  const ariaLabel = isOnline ? t('connectivity.ariaOnline') : t('connectivity.ariaOffline');

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 select-none no-drag"
      data-tauri-drag-region="false"
      role="status"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {isOnline ? (
        <Wifi size={14} className="text-action-primary shrink-0" />
      ) : (
        <WifiOff size={14} className="text-text-muted shrink-0" />
      )}
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-text-primary' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
};
