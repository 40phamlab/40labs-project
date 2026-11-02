import * as React from 'react';
import { Panel, Button, StatusBadge, DataTable, type ColumnDefinition } from '@40labs/ui-components';
import { Laptop } from 'lucide-react';
import type { DeviceRecord } from '@40labs/types';
import { useDevices } from '../../../../hooks/useDevices';
import { useStepUp } from '../../../auth/stepup/StepUpProvider';

interface SessionDeviceManagementSectionProps {
  setToast: (msg: string) => void;
}

export const SessionDeviceManagementSection: React.FC<SessionDeviceManagementSectionProps> = ({ setToast }) => {
  const { devices, revokeDevice, revokeAllDevices } = useDevices();
  const { requestStepUp } = useStepUp();

  const handleRevokeDevice = async (deviceId: string, deviceName: string) => {
    if (confirm(`Are you sure you want to revoke device "${deviceName}"?`)) {
      try {
        await requestStepUp(async () => {
          await revokeDevice(deviceId);
        }, 'users.manage');
        setToast(`Device "${deviceName}" revoked successfully.`);
      } catch (err: any) {
        setToast(err?.message || 'Failed to revoke device.');
      }
    }
  };

  const handleRevokeAll = async () => {
    if (confirm('Are you sure you want to revoke all paired Orbit Worker devices?')) {
      try {
        await requestStepUp(async () => {
          await revokeAllDevices();
        }, 'users.manage');
        setToast('All Orbit devices revoked successfully.');
      } catch (err: any) {
        setToast(err?.message || 'Failed to revoke Orbit devices.');
      }
    }
  };

  const deviceColumns: ColumnDefinition<DeviceRecord>[] = [
    {
      key: 'device_name',
      header: 'Device & Type',
      render: (dev) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-panel-subtle text-text-muted flex items-center justify-center border border-border/50">
            <Laptop size={15} />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              {dev.device_name}
            </div>
            <div className="text-[11px] text-text-muted font-mono">{dev.client_id || 'Orbit Worker'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'last_active_at',
      header: 'Last Seen',
      render: (dev) => (
        <span className="text-xs font-mono text-text-secondary">
          {dev.last_active_at ? new Date(dev.last_active_at).toLocaleString() : 'Active'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (dev) => (
        <StatusBadge
          status={dev.status === 'active' ? 'success' : 'error'}
          label={dev.status.toUpperCase()}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (dev) => (
        <div className="text-right">
          <Button
            type="button"
            variant="neutral"
            size="sm"
            onClick={() => handleRevokeDevice(dev.id, dev.device_name)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            Revoke
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">Active Sessions & Paired Devices</h2>
          <p className="text-xs text-text-muted">Current desktop session and paired Orbit Worker network devices.</p>
        </div>
        {devices.length > 0 && (
          <Button
            type="button"
            variant="neutral"
            size="sm"
            onClick={handleRevokeAll}
            className="text-xs text-rose-600 hover:bg-rose-50"
          >
            Revoke all Orbit devices
          </Button>
        )}
      </div>

      <Panel variant="raised" className="overflow-hidden">
        <DataTable
          data={devices}
          columns={deviceColumns}
          loading={false}
          emptyMessage="No paired Orbit Worker devices found."
          keyExtractor={(dev) => dev.id}
          density="compact"
        />
      </Panel>
    </div>
  );
};
