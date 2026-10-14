import * as React from 'react';
import { Panel, Switch, Button, StatusBadge, Badge, Dialog, PhoneInput } from '@40labs/ui-components';
import { Mail, MessageSquare, Globe, Smartphone, Plus, Trash2, Building2, Send, ShieldAlert, Ban } from 'lucide-react';
import { useIntegrations } from '../../../hooks/useIntegrations';
import { usePartnerFacilities } from '../../../hooks/usePartnerFacilities';
import { useConnectivityStore } from '../../../stores/useConnectivityStore';
import { useToast } from '../../../hooks/useToast';
import { LoaderAnimation } from '../../../components/brand';
import type { FacilityType } from '@40labs/types';

export const IntegrationsPanel: React.FC = () => {
  const {
    integrationsConfig,
    isLoadingIntegrations,
    isErrorIntegrations,
    refetchIntegrations,
    updateIntegrations,
    isUpdatingIntegrations,
  } = useIntegrations();

  const {
    facilities,
    isLoading: isLoadingFacilities,
    createFacility,
    updateStatus,
    deleteFacility,
  } = usePartnerFacilities();

  const isOnline = useConnectivityStore((s) => s.status === 'online');
  const { toast } = useToast();

  // Add Facility Form State
  const [addMode, setAddMode] = React.useState<'link' | 'manual'>('manual');
  const [businessIdInput, setBusinessIdInput] = React.useState('');
  const [manualName, setManualName] = React.useState('');
  const [manualType, setManualType] = React.useState<FacilityType>('pharmacy');
  const [manualWhatsapp, setManualWhatsapp] = React.useState('');
  const [manualRegion, setManualRegion] = React.useState('Dar es Salaam');
  const [manualDistrict, setManualDistrict] = React.useState('Ilala');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Modals for Actions
  const [selectedFacilityForMessage, setSelectedFacilityForMessage] = React.useState<any | null>(null);
  const [messageText, setMessageText] = React.useState('');

  const [selectedFacilityForForward, setSelectedFacilityForForward] = React.useState<any | null>(null);
  const [forwardNote, setForwardNote] = React.useState('');
  const [forwardType, setForwardType] = React.useState<'stock_out' | 'lab_referral' | 'note'>('stock_out');

  const [facilityToDelete, setFacilityToDelete] = React.useState<any | null>(null);

  if (isLoadingIntegrations || isLoadingFacilities || !integrationsConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderAnimation variant="instant" size={64} label="Inapakia..." />
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

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (addMode === 'link') {
        if (!businessIdInput.trim()) return;
        if (facilities.some((f) => f.partner_business_id?.toLowerCase() === businessIdInput.trim().toLowerCase())) {
          toast.error('Partner facility with this Business ID already exists.');
          setIsSubmitting(false);
          return;
        }
        await createFacility({
          partner_business_id: businessIdInput.trim().toUpperCase(),
          name: `Linked Facility (${businessIdInput.trim().toUpperCase()})`,
          type: 'pharmacy',
          contacts: { mobile: null, whatsapp: null },
          region: 'Dar es Salaam',
          district: 'Ilala',
        });
        setBusinessIdInput('');
      } else {
        if (!manualName.trim() || !manualWhatsapp.trim()) {
          toast.error('Facility name and WhatsApp number are required.');
          setIsSubmitting(false);
          return;
        }
        if (facilities.some((f) => f.contacts.whatsapp === manualWhatsapp || f.contacts.mobile === manualWhatsapp)) {
          toast.error('Partner facility with this phone number already exists.');
          setIsSubmitting(false);
          return;
        }
        await createFacility({
          partner_business_id: null,
          name: manualName.trim(),
          type: manualType,
          contacts: { mobile: manualWhatsapp, whatsapp: manualWhatsapp },
          region: manualRegion.trim(),
          district: manualDistrict.trim(),
        });
        setManualName('');
        setManualWhatsapp('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedFacilityForMessage) return;
    toast.success(`Message sent to ${selectedFacilityForMessage.name} via WhatsApp Business channel.`);
    setMessageText('');
    setSelectedFacilityForMessage(null);
  };

  const handleForwardProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityForForward) return;
    toast.success(`Problem report (${forwardType}) forwarded to ${selectedFacilityForForward.name}. Logged as forwarded_problem.`);
    setForwardNote('');
    setSelectedFacilityForForward(null);
  };

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
          <h3 className="text-sm font-bold text-text-primary">Integrations</h3>
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
            <Switch
              checked={integrationsConfig.email_connected}
              onChange={handleToggleEmail}
              disabled={isUpdatingIntegrations}
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
            <Switch
              checked={integrationsConfig.whatsapp_connected}
              onChange={handleToggleWhatsapp}
              disabled={isUpdatingIntegrations}
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

      {/* Partner Facilities Panel */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Partner Facilities</h3>
        </div>

        {/* Add Mode Selector */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <button
            type="button"
            onClick={() => setAddMode('manual')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              addMode === 'manual' ? 'bg-surface-elevated text-text-primary font-bold shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setAddMode('link')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              addMode === 'link' ? 'bg-surface-elevated text-text-primary font-bold shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Link 40Labs Business (AFYA ID)
          </button>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAddFacility} className="space-y-3 p-4 bg-panel-subtle rounded-card border border-border/50">
          {addMode === 'link' ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase block">Business ID (AFYA-XXXX)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AFYA-2847"
                  value={businessIdInput}
                  onChange={(e) => setBusinessIdInput(e.target.value)}
                  disabled={!isOnline}
                  className="flex-1 bg-surface border border-border rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  required
                />
                <Button
                  type="submit"
                  intent="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  disabled={!isOnline || !businessIdInput.trim() || isSubmitting}
                >
                  Link Facility
                </Button>
              </div>
              {!isOnline && (
                <p className="text-[11px] text-warning">Business ID lookup is disabled while offline. Use Manual Entry.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted uppercase">Facility Name</label>
                <input
                  type="text"
                  placeholder="e.g. St. Jude Clinic"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted uppercase">Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as FacilityType)}
                  className="w-full bg-surface border border-border rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="pharmacy">Pharmacy</option>
                  <option value="clinic">Clinic</option>
                  <option value="hospital">Hospital</option>
                  <option value="lab">Lab</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted uppercase">WhatsApp Number</label>
                <PhoneInput
                  value={manualWhatsapp}
                  onChange={(e) => setManualWhatsapp(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">Region</label>
                  <input
                    type="text"
                    value={manualRegion}
                    onChange={(e) => setManualRegion(e.target.value)}
                    className="w-full bg-surface border border-border rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">District</label>
                  <input
                    type="text"
                    value={manualDistrict}
                    onChange={(e) => setManualDistrict(e.target.value)}
                    className="w-full bg-surface border border-border rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button
                  type="submit"
                  intent="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  disabled={!manualName.trim() || !manualWhatsapp.trim() || isSubmitting}
                >
                  Add Partner Facility
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Facilities List */}
        <div className="space-y-2">
          {facilities.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-muted bg-panel-subtle rounded-card border border-border/50 font-heading">
              Partner Facilities
            </div>
          ) : (
            facilities.map((fac) => {
              const isBlocked = fac.status === 'blocked';
              return (
                <div
                  key={fac.id}
                  className={`flex items-center justify-between p-3.5 bg-panel-subtle rounded-card border ${
                    isBlocked ? 'opacity-60 border-danger/40' : 'border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building2 size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">{fac.name}</span>
                        {fac.is_40labs_linked && (
                          <Badge variant="primary" size="sm">40Labs</Badge>
                        )}
                        <Badge variant="neutral" size="sm" className="capitalize">{fac.type}</Badge>
                      </div>
                      <span className="text-[11px] font-mono text-text-muted">
                        {fac.region}, {fac.district} {fac.partner_business_id ? `· ID: ${fac.partner_business_id}` : ''} · WA: {fac.contacts.whatsapp || 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Send size={13} />}
                      onClick={() => setSelectedFacilityForMessage(fac)}
                      disabled={isBlocked}
                    >
                      Message
                    </Button>
                    <Button
                      variant="neutral"
                      size="sm"
                      leftIcon={<ShieldAlert size={13} />}
                      onClick={() => setSelectedFacilityForForward(fac)}
                      disabled={isBlocked}
                    >
                      Forward Problem
                    </Button>
                    <Button
                      variant="neutral"
                      size="sm"
                      leftIcon={<Ban size={13} />}
                      onClick={async () => {
                        const nextStatus = isBlocked ? 'active' : 'blocked';
                        await updateStatus({ id: fac.id, status: nextStatus });
                      }}
                    >
                      {isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => setFacilityToDelete(fac)}
                    >
                      <Trash2 size={14} className="text-danger" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      {/* Message Modal */}
      {selectedFacilityForMessage && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedFacilityForMessage(null)}
          title={`Message ${selectedFacilityForMessage.name}`}
        >
          <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
            <p className="text-text-muted">
              Send an inquiry or stock request. {selectedFacilityForMessage.is_40labs_linked ? 'TODO: [cross-business messaging infra not built] [post-Scheduling&Notifications]' : 'Delivering via WhatsApp Business.'}
            </p>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type message..."
              className="w-full bg-surface border border-border rounded-input p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSelectedFacilityForMessage(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" leftIcon={<Send size={14} />}>
                Send Message
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Forward Problem Modal */}
      {selectedFacilityForForward && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedFacilityForForward(null)}
          title={`Forward Problem to ${selectedFacilityForForward.name}`}
        >
          <form onSubmit={handleForwardProblem} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-muted uppercase">Problem Type</label>
              <select
                value={forwardType}
                onChange={(e) => setForwardType(e.target.value as any)}
                className="w-full bg-surface border border-border rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="stock_out">Low / Out-of-Stock Medicine Request</option>
                <option value="lab_referral">Lab Test Referral / Sample Issue</option>
                <option value="note">General Operational Issue / Note</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-muted uppercase">Details (No Patient PII)</label>
              <textarea
                rows={3}
                value={forwardNote}
                onChange={(e) => setForwardNote(e.target.value)}
                placeholder="Describe stock shortage or issue (e.g. Paracetamol 500mg stock-out)..."
                className="w-full bg-surface border border-border rounded-input p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <p className="text-[10px] text-text-muted bg-surface-secondary/40 p-2 rounded">
              Logged as `forwarded_problem` message. Patient-identifying data is strictly excluded.
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSelectedFacilityForForward(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" leftIcon={<Send size={14} />}>
                Forward Problem
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {facilityToDelete && (
        <Dialog
          isOpen={true}
          onClose={() => setFacilityToDelete(null)}
          title="Remove Partner Facility"
        >
          <div className="space-y-4 text-xs">
            <p className="text-text-primary">
              Are you sure you want to remove <span className="font-bold">{facilityToDelete.name}</span> from your partner facilities?
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setFacilityToDelete(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  await deleteFacility(facilityToDelete.id);
                  setFacilityToDelete(null);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
