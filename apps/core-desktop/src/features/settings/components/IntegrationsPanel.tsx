import * as React from 'react';
import { Panel, Toggle, Button, StatusBadge } from '@40labs/ui-components';
import { Mail, MessageSquare, Globe, Smartphone, Plus, Trash2 } from 'lucide-react';
import { useIntegrations } from '../../../hooks/useIntegrations';
import { useUsers } from '../../../hooks/useUsers';
import type { CollaboratorRef } from '@40labs/types';

export const IntegrationsPanel: React.FC = () => {
  const {
    integrationsConfig,
    isLoadingIntegrations,
    isErrorIntegrations,
    refetchIntegrations,
    updateIntegrations,
    isUpdatingIntegrations,
  } = useIntegrations();

  const { users } = useUsers();

  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [selectedScope, setSelectedScope] = React.useState<'view' | 'manage'>('view');

  if (isLoadingIntegrations || !integrationsConfig) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-text-muted">
        Loading integrations configuration...
      </div>
    );
  }

  const handleToggleEmail = async (checked: boolean) => {
    await updateIntegrations({ email_connected: checked });
  };

  const handleToggleWhatsapp = async (checked: boolean) => {
    await updateIntegrations({ whatsapp_connected: checked });
  };

  const handleToggleWebApp = async (appName: string, connected: boolean) => {
    const current = integrationsConfig.web_apps_connected || [];
    const next = connected
      ? Array.from(new Set([...current, appName]))
      : current.filter((a) => a !== appName);
    await updateIntegrations({ web_apps_connected: next });
  };

  const handleAddCollaborator = async () => {
    if (!selectedUserId) return;
    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return;

    if (integrationsConfig.collaborators.some((c) => c.user_id === user.id)) return;

    const newCollab: CollaboratorRef = {
      user_id: user.id,
      full_name: user.full_name,
      scope: selectedScope,
    };

    const nextCollabs = [...integrationsConfig.collaborators, newCollab];
    await updateIntegrations({ collaborators: nextCollabs });
    setSelectedUserId('');
  };

  const handleRemoveCollaborator = async (userId: string) => {
    const nextCollabs = integrationsConfig.collaborators.filter((c) => c.user_id !== userId);
    await updateIntegrations({ collaborators: nextCollabs });
  };

  const availableUsers = users.filter(
    (u) => !integrationsConfig.collaborators.some((c) => c.user_id === u.id)
  );

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl">
      {isErrorIntegrations && (
        <div className="p-3 bg-danger/10 text-danger text-xs rounded-card flex items-center justify-between">
          <span>Failed to load integrations configuration.</span>
          <button onClick={() => refetchIntegrations()} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* Communications & Channels Panel */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Communication Channels & External Integrations</h3>
          <p className="text-xs text-text-muted">
            Manage connectivity for notification gateways, web access portals, and communication relays. Note: Toggling configuration works offline; re-authenticating live gateway sessions requires active internet connectivity.
          </p>
        </div>

        <div className="space-y-3">
          {/* Email Integration Row */}
          <div className="flex items-center justify-between p-4 bg-panel-subtle rounded-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
                <Mail size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">Email Notifications & Gateway</span>
                <span className="text-[11px] font-mono text-text-muted">
                  {integrationsConfig.email_address || 'No email configured'}
                </span>
              </div>
            </div>
            <Toggle
              checked={integrationsConfig.email_connected}
              onChange={handleToggleEmail}
              disabled={isUpdatingIntegrations}
              label={integrationsConfig.email_connected ? 'Connected' : 'Disconnected'}
            />
          </div>

          {/* WhatsApp Integration Row */}
          <div className="flex items-center justify-between p-4 bg-panel-subtle rounded-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                <MessageSquare size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">WhatsApp Business API Relay</span>
                <span className="text-[11px] font-mono text-text-muted">
                  {integrationsConfig.whatsapp_number || 'No WhatsApp configured'}
                </span>
              </div>
            </div>
            <Toggle
              checked={integrationsConfig.whatsapp_connected}
              onChange={handleToggleWhatsapp}
              disabled={isUpdatingIntegrations}
              label={integrationsConfig.whatsapp_connected ? 'Connected' : 'Disconnected'}
            />
          </div>

          {/* Web Apps Integration Row */}
          <div className="flex items-center justify-between p-4 bg-panel-subtle rounded-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Globe size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">Web Portal & Admin App Access</span>
                <span className="text-[11px] font-mono text-text-muted">
                  {integrationsConfig.web_apps_connected.join(', ') || 'None connected'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['Web App', 'Admin Portal'].map((appName) => {
                const isConnected = integrationsConfig.web_apps_connected.includes(appName);
                return (
                  <Button
                    key={appName}
                    size="sm"
                    variant={isConnected ? 'primary' : 'neutral'}
                    onClick={() => handleToggleWebApp(appName, !isConnected)}
                    disabled={isUpdatingIntegrations}
                  >
                    {appName}: {isConnected ? 'Active' : 'Off'}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mobile Phone Gateway Row */}
          <div className="flex items-center justify-between p-4 bg-panel-subtle rounded-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <Smartphone size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">Primary SMS / Mobile Gateway</span>
                <span className="text-[11px] font-mono text-text-muted">
                  {integrationsConfig.mobile_phone || 'Not configured'}
                </span>
              </div>
            </div>
            <StatusBadge status="active" label="Configured" />
          </div>
        </div>
      </Panel>

      {/* Collaborators & Shared Access Panel */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Collaborators & System Access</h3>
          <p className="text-xs text-text-muted">
            Assign staff members as system collaborators with view or management access scopes. Pulls directly from staff directory.
          </p>
        </div>

        {/* Add Collaborator Form */}
        <div className="flex items-end gap-3 p-3 bg-panel-subtle rounded-card border border-border/50">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase">Select Staff Member</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-panel border border-border rounded-input px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose staff...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="w-36 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase">Access Scope</label>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as 'view' | 'manage')}
              className="w-full bg-panel border border-border rounded-input px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="view">View Only</option>
              <option value="manage">Manage</option>
            </select>
          </div>

          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<Plus size= {14} />}
            onClick={handleAddCollaborator}
            disabled={!selectedUserId || isUpdatingIntegrations}
          >
            Add
          </Button>
        </div>

        {/* Collaborators List */}
        <div className="space-y-2">
          {integrationsConfig.collaborators.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted bg-panel-subtle rounded-card border border-border/50">
              No collaborators assigned.
            </div>
          ) : (
            integrationsConfig.collaborators.map((collab) => (
              <div
                key={collab.user_id}
                className="flex items-center justify-between p-3 bg-panel-subtle rounded-card border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {collab.full_name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary block">{collab.full_name}</span>
                    <span className="text-[10px] font-mono text-text-muted">ID: {collab.user_id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge
                    status={collab.scope === 'manage' ? 'active' : 'info'}
                    label={collab.scope.toUpperCase()}
                  />
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collab.user_id)}
                    disabled={isUpdatingIntegrations}
                  >
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
};
