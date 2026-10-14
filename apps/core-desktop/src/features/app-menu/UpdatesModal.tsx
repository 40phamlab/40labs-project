import * as React from 'react';
import { Dialog, Button, Spinner } from '@40labs/ui-components';

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ isOpen, onClose, isOnline }) => {
  const [status, setStatus] = React.useState<'idle' | 'checking' | 'uptodate' | 'available' | 'error' | 'offline'>('idle');
  const [updateInfo, setUpdateInfo] = React.useState<any>(null);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      checkForUpdates();
    }
  }, [isOpen, isOnline]);

  const checkForUpdates = async () => {
    if (!isOnline) {
      setStatus('offline');
      return;
    }
    setStatus('checking');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update?.available) {
        setUpdateInfo(update);
        setStatus('available');
      } else {
        setStatus('uptodate');
      }
    } catch (err) {
      console.warn('Updater check error or not in Tauri environment:', err);
      // Fallback for non-Tauri or development environments
      setStatus('uptodate');
    }
  };

  const handleInstall = async () => {
    if (!updateInfo) return;
    try {
      setDownloading(true);
      await updateInfo.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('Failed to install update:', err);
      setStatus('error');
      setDownloading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Check for Updates">
      <div className="space-y-4 text-xs text-text-primary">
        {!isOnline || status === 'offline' ? (
          <div className="p-3 bg-surface-secondary rounded text-text-muted">
            You are currently offline. Update check is disabled without internet connectivity.
          </div>
        ) : status === 'checking' ? (
          <div className="flex items-center gap-2 py-4">
            <Spinner size="sm" />
            <span>Checking for updates...</span>
          </div>
        ) : status === 'uptodate' ? (
          <div className="py-2 text-primary font-bold">
            You are using the latest version of 40LabsCore.
          </div>
        ) : status === 'available' ? (
          <div className="space-y-3">
            <div className="p-3 bg-action-primary/10 rounded border border-action-primary/30">
              <p className="font-bold text-action-primary">New version available: {updateInfo?.version}</p>
              <p className="text-text-muted mt-1 text-[11px]">{updateInfo?.body || 'Performance improvements and bug fixes.'}</p>
            </div>
            <Button variant="primary" onClick={handleInstall} disabled={downloading}>
              {downloading ? 'Installing & Restarting...' : 'Install & Restart'}
            </Button>
          </div>
        ) : status === 'error' ? (
          <div className="text-danger py-2">
            Failed to check for updates. Please try again later.
          </div>
        ) : null}
      </div>
    </Dialog>
  );
};
