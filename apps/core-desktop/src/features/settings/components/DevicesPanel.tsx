import * as React from 'react';
import {
  DataTable,
  StatusBadge,
  type ColumnDefinition,
  IconButton,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  Panel,
  Modal,
} from '@40labs/ui-components';
import { MoreVertical, Shield, Power, Trash2, QrCode } from 'lucide-react';
import type { PairedDevice } from '@40labs/types';
import { useDevices } from '../../../hooks/useDevices';
import { useUsers } from '../../../hooks/useUsers';
import { auditApi } from '../../../api';
import { PinConfirmModal } from './PinConfirmModal';

const RowActions = ({
  device,
  onRemove,
  onBlock,
  onViewPermission,
}: {
  device: PairedDevice;
  onRemove: (device: PairedDevice) => void;
  onBlock: (device: PairedDevice) => void;
  onViewPermission: (device: PairedDevice) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <IconButton
          icon={<MoreVertical size={14} />}
          label="Device Actions"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        />
      }
    >
      <DropdownMenuItem
        label="View Staff Permissions"
        icon={<Shield size={14} />}
        onClick={() => {
          onViewPermission(device);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label={device.status === 'blocked' ? 'Unblock Device' : 'Block Device'}
        icon={<Power size={14} />}
        variant={device.status === 'blocked' ? 'default' : 'danger'}
        onClick={() => {
          onBlock(device);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Remove Pairing"
        icon={<Trash2 size={14} />}
        variant="danger"
        onClick={() => {
          onRemove(device);
          setIsOpen(false);
        }}
      />
    </DropdownMenu>
  );
};

export const DevicesPanel: React.FC = () => {
  const {
    devices,
    isLoadingDevices,
    isErrorDevices,
    refetchDevices,
    blockDevice,
    unblockDevice,
    removeDevice,
    isBlocking,
    isRemoving,
  } = useDevices();

  const { users } = useUsers();

  const [activeTab, setActiveTab] = React.useState<'active' | 'recent' | 'all'>('active');
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);
  const [selectedDeviceForPin, setSelectedDeviceForPin] = React.useState<{
    device: PairedDevice;
    action: 'block' | 'remove';
  } | null>(null);

  const [selectedDeviceForPerms, setSelectedDeviceForPerms] = React.useState<PairedDevice | null>(null);

  const filteredDevices = React.useMemo(() => {
    if (activeTab === 'active') {
      return devices.filter((d) => d.status === 'active');
    }
    if (activeTab === 'recent') {
      return devices.filter((d) => d.status === 'active' || d.status === 'blocked');
    }
    return devices;
  }, [devices, activeTab]);

  const handlePinConfirm = async (_pin: string) => {
    if (!selectedDeviceForPin) return;
    const { device, action } = selectedDeviceForPin;

    const auditAction = action === 'block' ? 'device_block' : 'device_remove';

    // Write audit log first (audit-log-first insert order per GOTCHAS #9)
    await auditApi.recordEntry({
      action: auditAction as any,
      performed_by_user_id: device.user_id,
      target_entity_type: 'PairedDevice',
      target_entity_id: device.id,
      metadata: { device_label: device.device_label, pin_verified: true },
    });

    if (action === 'block') {
      if (device.status === 'blocked') {
        await unblockDevice(device.id);
      } else {
        await blockDevice(device.id);
      }
    } else {
      await removeDevice(device.id);
    }

    setSelectedDeviceForPin(null);
  };

  const pairedUser = selectedDeviceForPerms
    ? users.find((u) => u.id === selectedDeviceForPerms.user_id)
    : null;

  const columns: ColumnDefinition<PairedDevice>[] = [
    {
      key: 'device_label',
      header: 'Device Label',
      render: (device) => (
        <div>
          <span className="font-semibold text-text-primary block">{device.device_label}</span>
          <span className="text-[10px] font-mono text-text-muted">ID: {device.id}</span>
        </div>
      ),
    },
    {
      key: 'user_id',
      header: 'Paired User',
      render: (device) => {
        const u = users.find((usr) => usr.id === device.user_id);
        return (
          <span className="text-xs font-medium text-text-secondary">
            {u ? u.full_name : device.user_id}
          </span>
        );
      },
    },
    {
      key: 'paired_at',
      header: 'Paired At',
      render: (device) => (
        <span className="text-xs font-mono text-text-muted">
          {new Date(device.paired_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'last_connected_at',
      header: 'Last Connected',
      render: (device) => (
        <span className="text-xs font-mono text-text-muted">
          {device.last_connected_at ? new Date(device.last_connected_at).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (device) => {
        const badgeStatus =
          device.status === 'active' ? 'active' : device.status === 'blocked' ? 'error' : 'inactive';
        return <StatusBadge status={badgeStatus} label={device.status.toUpperCase()} />;
      },
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      render: (device) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setSelectedDeviceForPerms(device)}
          >
            Permissions
          </Button>
          <RowActions
            device={device}
            onRemove={(d) => setSelectedDeviceForPin({ device: d, action: 'remove' })}
            onBlock={(d) => setSelectedDeviceForPin({ device: d, action: 'block' })}
            onViewPermission={(d) => setSelectedDeviceForPerms(d)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Orbit Worker & Hardware Device Trust</h3>
            <p className="text-xs text-text-muted">
              Manage persistent POS terminals and mobile companion nodes. Pairing is LAN-only; revocation or blocking propagates near-instantly on the local network on next connection attempt.
            </p>
          </div>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<QrCode size={14} />}
            onClick={() => setIsQrModalOpen(true)}
          >
            Add Device (Pairing QR)
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-border/40 pb-3">
          {[
            { id: 'active', label: 'Active Devices' },
            { id: 'recent', label: 'Recent / All Connected' },
            { id: 'all', label: 'All (Including Removed)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={[
                'px-3 py-1.5 text-xs font-bold rounded transition-colors',
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-text-muted hover:text-text-primary hover:bg-panel-subtle',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="border border-border/50 rounded-card overflow-hidden">
          <DataTable
            data={filteredDevices}
            columns={columns}
            loading={isLoadingDevices}
            error={isErrorDevices ? 'Failed to load paired devices.' : null}
            onRetry={refetchDevices}
            emptyMessage="No paired devices found."
            keyExtractor={(d) => d.id}
            density="compact"
          />
        </div>
      </Panel>

      {/* QR Code Modal for Pairing */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Pair Orbit Worker Device (QR Code)"
        size="md"
        footer={
          <div className="flex justify-end w-full">
            <Button intent="neutral" onClick={() => setIsQrModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
          <div className="w-48 h-48 bg-white p-3 rounded-card flex items-center justify-center border border-border">
            <div className="w-full h-full border-4 border-dashed border-text-primary/40 flex flex-col items-center justify-center p-2 text-text-primary font-mono text-[10px]">
              <QrCode size={64} className="text-text-primary mb-2" />
              <span>ORBIT-PAIRING-TOKEN</span>
              <span className="text-[9px] text-text-muted">WS_DEV_001://LAN-SECURE</span>
            </div>
          </div>
          <p className="text-xs text-text-muted max-w-sm">
            Scan this secure QR code using the Orbit Worker companion app on your mobile device or terminal to establish persistent local network trust.
          </p>
        </div>
      </Modal>

      {/* Staff Permissions Read-Only Modal */}
      <Modal
        isOpen={Boolean(selectedDeviceForPerms)}
        onClose={() => setSelectedDeviceForPerms(null)}
        title={`Staff Permissions: ${pairedUser ? pairedUser.full_name : 'Unknown User'}`}
        size="md"
        footer={
          <div className="flex justify-end w-full">
            <Button intent="neutral" onClick={() => setSelectedDeviceForPerms(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-panel-subtle rounded-card border border-border/50">
            <span className="text-xs font-bold text-text-primary block">Device: {selectedDeviceForPerms?.device_label}</span>
            <span className="text-[11px] font-mono text-text-muted">Role: {pairedUser?.role.toUpperCase()}</span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Assigned Permission Set (Read-Only)
            </h4>
            {pairedUser?.role === 'sudo' ? (
              <div className="p-3 bg-info/10 text-info text-xs rounded-card">
                Sudo user has full administrative privileges and implicit access to all modules.
              </div>
            ) : pairedUser?.permissions ? (
              <div className="grid grid-cols-1 gap-2 bg-panel-subtle p-3 rounded-card border border-border/50">
                {Object.entries(pairedUser.permissions).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between text-xs text-text-primary py-1">
                    <span className="font-medium font-mono">{key}</span>
                    <StatusBadge status={enabled ? 'active' : 'inactive'} label={enabled ? 'Enabled' : 'Disabled'} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-text-muted">No specific permissions configured.</div>
            )}
          </div>
        </div>
      </Modal>

      {/* PIN Confirmation Modal for Block/Remove */}
      <PinConfirmModal
        isOpen={Boolean(selectedDeviceForPin)}
        title={selectedDeviceForPin?.action === 'block' ? 'Authorize Device Block' : 'Authorize Device Removal'}
        onConfirm={handlePinConfirm}
        onCancel={() => setSelectedDeviceForPin(null)}
        isLoading={isBlocking || isRemoving}
      />
    </div>
  );
};
