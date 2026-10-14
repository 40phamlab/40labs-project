import * as React from 'react';
import { Dialog } from '@40labs/ui-components';
import { getVersion } from '@tauri-apps/api/app';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
  workspaceName?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, businessId, workspaceName }) => {
  const [version, setVersion] = React.useState('0.1.0-alpha');

  React.useEffect(() => {
    getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="About 40Labs">
      <div className="space-y-3 text-xs text-text-primary">
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-text-muted">Application</span>
          <span className="font-bold">40LabsCore</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-text-muted">Version</span>
          <span className="font-mono">{version}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-text-muted">Build Environment</span>
          <span className="font-mono">{import.meta.env.MODE}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-text-muted">Business ID</span>
          <span className="font-mono">{businessId || 'AFYA-0001'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-text-muted">Workspace</span>
          <span>{workspaceName || 'Primary Workspace'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-text-muted">Compliance Status</span>
          <span className="text-primary font-bold">TMDA / TRA EFD Active</span>
        </div>
        <div className="pt-2">
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline text-xs"
          >
            View Open Source Licenses
          </a>
        </div>
      </div>
    </Dialog>
  );
};
