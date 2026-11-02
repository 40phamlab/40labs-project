import * as React from 'react';
import { Panel } from '@40labs/ui-components';
import { ShieldCheck, Users, Activity, AlertTriangle } from 'lucide-react';

interface SecurityOverviewProps {
  activeDeviceCount: number;
  is2FaEnabled: boolean;
  lastActivityText: string;
}

export const SecurityOverview: React.FC<SecurityOverviewProps> = ({
  activeDeviceCount,
  is2FaEnabled,
  lastActivityText,
}) => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-bold text-text-primary tracking-tight">Security Overview</h2>
        <p className="text-xs text-text-muted">Real-time status of your account protection, authentication, and sessions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Account Protection</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active & Secured
            </div>
            <p className="text-[11px] text-text-muted mt-1">Argon2id hashing & PIN protection enabled.</p>
          </div>
        </Panel>

        <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Active Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary font-mono">{activeDeviceCount} Device(s)</div>
            <p className="text-[11px] text-text-muted mt-1">Manage logged-in devices securely.</p>
          </div>
        </Panel>

        <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Two-Factor Auth</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${is2FaEnabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
              {is2FaEnabled ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            </div>
          </div>
          <div>
            <div className={`text-sm font-bold ${is2FaEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
              {is2FaEnabled ? 'Enabled' : 'Not configured'}
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              {is2FaEnabled ? 'Authenticator app linked' : 'TOTP 2FA configuration'}
            </p>
          </div>
        </Panel>

        <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Last Activity</span>
            <div className="w-8 h-8 rounded-xl bg-panel-subtle text-text-muted flex items-center justify-center border border-border/50">
              <Activity size={18} />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary truncate">Security Event</div>
            <p className="text-[10px] font-mono text-text-muted mt-1 truncate">{lastActivityText}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
};
