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
  FilterTabs,
} from '@40labs/ui-components';
import { MoreVertical, Shield, Power, Trash2, QrCode, RefreshCw } from 'lucide-react';
import type { PairedDevice, AuditAction } from '@40labs/types';
import { useDevices } from '../../../hooks/useDevices';
import { useUsers } from '../../../hooks/useUsers';
import { auditApi, devicesApi, PairingSessionInfo } from '../../../api';
import { useStepUp } from '../../../features/auth/stepup/StepUpProvider';
import { QrCodeSvg } from '../../../components/QrCodeSvg';

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
        label="Edit Permissions"
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
    updatePermissions,
    isUpdatingPermissions,
  } = useDevices();

  const { users } = useUsers();
  const { requestStepUp } = useStepUp();

  const [activeTab, setActiveTab] = React.useState<'active' | 'recent' | 'all'>('active');
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);
  const [pairingSession, setPairingSession] = React.useState<PairingSessionInfo | null>(null);
  const [isGeneratingSession, setIsGeneratingSession] = React.useState(false);

  const [isPairingConfigOpen, setIsPairingConfigOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string>('');
  const [pairingPermissions, setPairingPermissions] = React.useState<Record<string, boolean>>({
    can_update_stock: false,
    can_adjust_stock: false,
    can_issue_refund: false,
    can_approve_po: false,
    can_add_lab_sample: false,
    can_override_lab_result: false,
    can_view_reports: true,
  });

  React.useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      const activeUser = users.find((u) => u.active) || users[0];
      if (activeUser) {
        setSelectedUserId(activeUser.id);
        if (activeUser.permissions) {
          setPairingPermissions({ ...(activeUser.permissions as Record<string, boolean>) });
        }
      }
    }
  }, [users, selectedUserId]);

  const handleOpenPairingConfig = () => {
    setIsPairingConfigOpen(true);
  };

  const handleGeneratePairingSession = async () => {
    if (!selectedUserId) return;
    setIsGeneratingSession(true);
    setIsPairingConfigOpen(false);
    try {
      const session = await devicesApi.initiatePairing(selectedUserId, pairingPermissions);
      setPairingSession(session);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error('Failed to initiate pairing session:', err);
    } finally {
      setIsGeneratingSession(false);
    }
  };

  const handleClosePairingModal = () => {
    setIsQrModalOpen(false);
    setPairingSession(null);
  };

  const [selectedDeviceForPerms, setSelectedDeviceForPerms] = React.useState<PairedDevice | null>(null);
  const [editablePermissions, setEditablePermissions] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (selectedDeviceForPerms) {
      const user = users.find((u) => u.id === selectedDeviceForPerms.user_id);
      const initialPerms = (user?.permissions as Record<string, boolean>) || {
        can_update_stock: true,
        can_adjust_stock: false,
        can_issue_refund: false,
        can_approve_po: false,
        can_add_lab_sample: true,
        can_override_lab_result: false,
        can_view_reports: true,
      };
      setEditablePermissions({ ...initialPerms });
    }
  }, [selectedDeviceForPerms, users]);

  const filteredDevices = React.useMemo(() => {
    if (activeTab === 'active') {
      return devices.filter((d) => d.status === 'active');
    }
    if (activeTab === 'recent') {
      return devices.filter((d) => d.status === 'active' || d.status === 'blocked');
    }
    return devices;
  }, [devices, activeTab]);

  const handleDeviceAction = async (device: PairedDevice, action: 'block' | 'remove') => {
    try {
      await requestStepUp(async (grantToken?: string) => {
        const auditAction: AuditAction = action === 'block' ? 'device_block' : 'device_remove';
        await auditApi.recordEntry({
          action: auditAction,
          performed_by_user_id: device.user_id,
          target_entity_type: 'PairedDevice',
          target_entity_id: device.id,
          metadata: { device_label: device.device_label, pin_verified: true, step_up_token: grantToken },
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
      }, 'devices.manage');
    } catch (err) {
      console.error('Device action failed:', err);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedDeviceForPerms) return;
    try {
      await updatePermissions(selectedDeviceForPerms.id, editablePermissions);
      setSelectedDeviceForPerms(null);
    } catch (err) {
      console.error('Failed to update device permissions:', err);
    }
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
      width: '130px',
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
            onRemove={(d) => handleDeviceAction(d, 'remove')}
            onBlock={(d) => handleDeviceAction(d, 'block')}
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
            <h3 className="text-sm font-bold text-text-primary">Orbit Worker Mobile Connections</h3>
            <p className="text-xs text-text-muted">Manage authenticated mobile workers and LAN secure pairing sessions.</p>
          </div>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<QrCode size={14} />}
            onClick={handleOpenPairingConfig}
            disabled={isGeneratingSession}
          >
            {isGeneratingSession ? 'Initializing Session...' : 'Add Device (Pairing QR)'}
          </Button>
        </div>

        {/* Filter Tabs */}
        <FilterTabs
          tabs={[
            { id: 'active', label: 'Active Devices' },
            { id: 'recent', label: 'Recent / All Connected' },
            { id: 'all', label: 'All (Including Removed)' },
          ]}
          activeTabId={activeTab}
          onChange={(id) => setActiveTab(id as 'active' | 'recent' | 'all')}
        />

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

      {/* Pairing Configuration Modal: Select User & Permissions */}
      <Modal
        isOpen={isPairingConfigOpen}
        onClose={() => setIsPairingConfigOpen(false)}
        title="Configure Orbit Worker Pairing"
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button intent="neutral" onClick={() => setIsPairingConfigOpen(false)}>
              Cancel
            </Button>
            <Button intent="primary" onClick={handleGeneratePairingSession} disabled={!selectedUserId || isGeneratingSession}>
              {isGeneratingSession ? 'Generating...' : 'Generate Pairing QR Code'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-primary block mb-1.5">Select Staff User</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                const uid = e.target.value;
                setSelectedUserId(uid);
                const u = users.find((usr) => usr.id === uid);
                if (u && u.permissions) {
                  setPairingPermissions({ ...(u.permissions as Record<string, boolean>) });
                }
              }}
              className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2 text-text-primary"
            >
              {users.filter((u) => u.active).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-text-muted mt-1">
              The paired device will inherit this user's identity and permissions.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Initial Device Permissions
            </h4>
            <div className="space-y-2 bg-panel-subtle p-3 rounded-card border border-border/50 max-h-60 overflow-y-auto">
              {Object.entries(pairingPermissions).map(([key, enabled]) => {
                const labelName = key
                  .replace(/^can_/, '')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-xs text-text-primary">{labelName}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs text-text-primary cursor-pointer">
                        <input
                          type="radio"
                          name={`pairing_${key}`}
                          checked={enabled === true}
                          onChange={() => setPairingPermissions((prev) => ({ ...prev, [key]: true }))}
                          className="accent-primary"
                        />
                        <span>Enabled</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
                        <input
                          type="radio"
                          name={`pairing_${key}`}
                          checked={enabled === false}
                          onChange={() => setPairingPermissions((prev) => ({ ...prev, [key]: false }))}
                          className="accent-primary"
                        />
                        <span>Disabled</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal for Pairing */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={handleClosePairingModal}
        title="Pair Orbit Worker Device (LAN Secure)"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono text-text-muted">
              Session Expires: {pairingSession ? new Date(pairingSession.expiresAt).toLocaleTimeString() : ''}
            </span>
            <div className="flex gap-2">
              <Button intent="neutral" onClick={handleOpenPairingConfig} leftIcon={<RefreshCw size={14} />}>
                Refresh QR
              </Button>
              <Button intent="primary" onClick={handleClosePairingModal}>
                Done
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
          {pairingSession ? (
            <>
              <QrCodeSvg value={pairingSession.qrPayload} size={200} />
              <div className="space-y-1">
                <span className="text-xs font-mono font-semibold text-text-primary block">
                  Endpoint: {pairingSession.endpoint}
                </span>
                <span className="text-[10px] font-mono text-text-muted block">
                  Session ID: {pairingSession.sessionId}
                </span>
              </div>
              <p className="text-xs text-text-muted max-w-sm">
                Scan this high-contrast secure QR code using the Orbit Worker mobile app while connected to the same local network (LAN) to complete authenticated pairing.
              </p>
            </>
          ) : (
            <div className="py-12 text-xs text-text-muted">Initializing pairing session...</div>
          )}
        </div>
      </Modal>

      {/* Edit Permissions Modal with Radio-Style Enable/Disable Controls */}
      <Modal
        isOpen={Boolean(selectedDeviceForPerms)}
        onClose={() => setSelectedDeviceForPerms(null)}
        title={`Edit Permissions: ${selectedDeviceForPerms?.device_label || 'Device'}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button intent="neutral" onClick={() => setSelectedDeviceForPerms(null)}>
              Cancel
            </Button>
            <Button intent="primary" onClick={handleSavePermissions} disabled={isUpdatingPermissions}>
              {isUpdatingPermissions ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-panel-subtle rounded-card border border-border/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-primary block">Device: {selectedDeviceForPerms?.device_label}</span>
              <span className="text-[11px] font-mono text-text-muted">User: {pairedUser ? pairedUser.full_name : selectedDeviceForPerms?.user_id}</span>
            </div>
            <StatusBadge status="active" label={selectedDeviceForPerms?.status?.toUpperCase() || 'ACTIVE'} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Granular Capability Permissions (Radio-Style Controls)
            </h4>
            <p className="text-[11px] text-text-muted mb-4">
              Configure explicit Enabled / Disabled permissions for this device. Authorization is enforced server-side.
            </p>

            <div className="space-y-3 bg-panel-subtle p-4 rounded-card border border-border/50">
              {Object.entries(editablePermissions).map(([key, enabled]) => {
                const labelName = key
                  .replace(/^can_/, '')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <span className="text-xs font-semibold text-text-primary block">{labelName}</span>
                      <span className="text-[10px] font-mono text-text-muted">{key}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-text-primary cursor-pointer">
                        <input
                          type="radio"
                          name={key}
                          checked={enabled === true}
                          onChange={() => setEditablePermissions((prev) => ({ ...prev, [key]: true }))}
                          className="accent-primary"
                        />
                        <span>Enabled</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                        <input
                          type="radio"
                          name={key}
                          checked={enabled === false}
                          onChange={() => setEditablePermissions((prev) => ({ ...prev, [key]: false }))}
                          className="accent-primary"
                        />
                        <span>Disabled</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
