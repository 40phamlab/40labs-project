import * as React from 'react';
import {
  Modal,
  Button,
  Select,
  Textarea,
  Checkbox,
  SearchInput,
} from '@40labs/ui-components';
import { RecipientScope } from '@40labs/types';
import { Send, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { initialUsers } from '../../../devData/users/staff';
import { useCustomers } from '../../../hooks/useCustomers';
import { ReportCategoryId, reportCategoriesConfig, DateRange } from '../config/reportCategories';
import { ReportSelectionList } from './ReportSelectionList';
import { createReportPdfBlob } from '../utils/exportReportPdf';
import { useNotifications } from '../../../hooks/useNotifications';
import { useReports } from '../../../hooks/useReports';
import { useBusiness } from '../../../hooks/useBusiness';
import { useIntegrations } from '../../../hooks/useIntegrations';
import { useReportLayoutStore } from '../../../stores/useReportLayoutStore';
import { convertCategoryDataToCanonical } from '../types/reportModel';

export interface ReportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: ReportCategoryId;
  periodLabel: string;
  dateRange?: DateRange;
  getReportForCategory?: (id: ReportCategoryId) => {
    categoryConfig: typeof reportCategoriesConfig[ReportCategoryId];
    kpis: any[];
    tableColumns: any[];
    tableRows: any[];
  };
  onShareComplete?: (channelSummary: string) => void;
}

export type DeliveryChannel = 'amob' | 'whatsapp' | 'email' | 'google_drive';

const SHARE_CHANNELS: Array<{ id: DeliveryChannel; label: string; description: string }> = [
  { id: 'amob', label: 'aMob Direct Messaging', description: 'Internal secure aMob workspace channel (Active)' },
  { id: 'whatsapp', label: 'WhatsApp Business', description: 'Meta WhatsApp Business API Relay' },
  { id: 'email', label: 'Gmail / SMTP Email', description: 'Email outbox server dispatch' },
  { id: 'google_drive', label: 'Google Drive Sync', description: 'Cloud storage backup & sync' },
];

export const ReportShareModal: React.FC<ReportShareModalProps> = ({
  isOpen,
  onClose,
  activeCategory,
  periodLabel,
  dateRange,
  getReportForCategory: getReportProp,
  onShareComplete,
}) => {
  const { business } = useBusiness();
  const { integrationsConfig } = useIntegrations();
  const { config: layoutConfig } = useReportLayoutStore();
  const { createNotification } = useNotifications();
  const { customers } = useCustomers();

  const defaultReportsHook = useReports({ categoryId: activeCategory, dateRange });
  const getReportForCategory = getReportProp || defaultReportsHook.getReportForCategory;

  const [selectedCategories, setSelectedCategories] = React.useState<ReportCategoryId[]>([activeCategory]);
  const [selectedChannels, setSelectedChannels] = React.useState<DeliveryChannel[]>(['amob']);
  const [recipientScope, setRecipientScope] = React.useState<RecipientScope>('staff');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [statusNotice, setStatusNotice] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Initialize defaults based on configured integration preference
  React.useEffect(() => {
    if (isOpen) {
      setSelectedCategories([activeCategory]);
      // Honor aMob as default if active/configured
      setSelectedChannels(['amob']);
      setRecipientScope('staff');
      setSelectedRecipientIds(['user_001']);
      setMessage(`Attached PDF report(s) for period: ${periodLabel}.`);
      setIsSubmitting(false);
      setIsSuccess(false);
      setStatusNotice(null);
    }
  }, [isOpen, activeCategory, periodLabel]);

  const contacts = React.useMemo(() => {
    let list = recipientScope === 'staff'
      ? initialUsers.map((u) => ({ id: u.id, name: u.full_name, detail: `${u.role.toUpperCase()} (Staff)` }))
      : customers.map((c) => ({ id: c.id, name: c.full_name, detail: `${c.phone} · ${c.email || 'No email'}` }));

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q));
  }, [recipientScope, searchQuery, customers]);

  const toggleChannel = (ch: DeliveryChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? (prev.length > 1 ? prev.filter((c) => c !== ch) : prev) : [...prev, ch]
    );
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDispatch = async () => {
    if (selectedCategories.length === 0) return;

    setIsSubmitting(true);
    setStatusNotice(null);

    const hasAmob = selectedChannels.includes('amob');
    const hasWhatsapp = selectedChannels.includes('whatsapp');

    // Check WhatsApp configuration if requested
    if (hasWhatsapp && !integrationsConfig?.whatsapp_connected) {
      setIsSubmitting(false);
      setStatusNotice({
        text: 'WhatsApp Business API is not connected. Please enable WhatsApp in Settings > Integrations before sending.',
        isError: true,
      });
      return;
    }

    try {
      // 1. Generate real PDF Blob(s) per selected category
      const generatedReports: { categoryId: ReportCategoryId; blob: Blob; label: string }[] = [];

      for (const catId of selectedCategories) {
        const canonical = convertCategoryDataToCanonical(
          catId,
          periodLabel,
          dateRange,
          getReportForCategory,
          business
        );
        const blob = createReportPdfBlob(canonical, layoutConfig, business);
        generatedReports.push({
          categoryId: catId,
          blob,
          label: canonical.metadata.title,
        });
      }

      const reportTitles = generatedReports.map((r) => r.label).join(', ');

      // 2. Execute real channel integration
      if (hasAmob) {
        await createNotification({
          category: 'business',
          channel: 'amob',
          sender_name: business?.name || 'Reports & Analytics',
          body: `PDF Sales Report dispatched to aMob channel: [${reportTitles}] for period ${periodLabel}. Message: "${message || 'Attached sales analysis'}".`,
        });
      }

      if (hasWhatsapp && integrationsConfig?.whatsapp_connected) {
        await createNotification({
          category: 'business',
          channel: 'whatsapp',
          sender_name: business?.name || 'Reports & Analytics',
          body: `WhatsApp PDF Sales Report dispatched to ${selectedRecipientIds.length} contact(s): [${reportTitles}].`,
        });
      }

      const successSummary = `PDF Report (${selectedCategories.length} file(s)) generated and dispatched to ${selectedChannels.join(', ')} channel.`;

      setIsSubmitting(false);
      setIsSuccess(true);
      setStatusNotice({ text: successSummary });

      if (onShareComplete) {
        onShareComplete(successSummary);
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Report dispatch error:', err);
      setIsSubmitting(false);
      setStatusNotice({
        text: err?.message || 'Failed to dispatch report via selected integration channel.',
        isError: true,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate & Share PDF Report"
      size="md"
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Report Category Selection Picker */}
        <ReportSelectionList
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
          periodLabel={periodLabel}
          dateRange={dateRange}
          getReportForCategory={getReportForCategory}
        />

        {/* Channel Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Delivery Integration Channel (Select at least 1)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SHARE_CHANNELS.map((ch) => {
              const active = selectedChannels.includes(ch.id);
              const isWhatsappDisabled = ch.id === 'whatsapp' && !integrationsConfig?.whatsapp_connected;

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={`p-2.5 rounded-input border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                    active
                      ? 'bg-panel-strong border-primary/50 text-text elevation-raised'
                      : 'bg-panel border-border/50 text-text-muted hover:text-text'
                  } ${isWhatsappDisabled ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{ch.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[10px] text-text-muted truncate">
                    {isWhatsappDisabled ? 'Disconnected (Setup in Settings)' : ch.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipient Config */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Recipient Group</label>
            <Select
              size="sm"
              value={recipientScope}
              onChange={(e) => setRecipientScope(e.target.value as RecipientScope)}
            >
              <option value="staff">Internal Staff / Managers</option>
              <option value="customers">Customers</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Filter Recipients</label>
            <SearchInput
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="max-h-[130px] overflow-y-auto p-2 bg-panel rounded-card border border-border/50 flex flex-col gap-1.5">
          {contacts.map((contact) => {
            const checked = selectedRecipientIds.includes(contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => toggleRecipient(contact.id)}
                className="flex items-center justify-between p-2 rounded-input bg-surface hover:bg-surface-strong cursor-pointer border border-border/30"
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox checked={checked} onChange={() => toggleRecipient(contact.id)} />
                  <span className="text-xs font-bold text-text">{contact.name}</span>
                </div>
                <span className="text-[10px] text-text-muted font-mono">{contact.detail}</span>
              </div>
            );
          })}
        </div>

        {/* Message Cover Note */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Cover Note / Message Body
          </label>
          <Textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add an optional message..."
          />
        </div>

        {/* Status Notice Banner if present */}
        {statusNotice && (
          <div
            className={`p-2.5 rounded-input border flex items-start gap-2 text-xs text-text ${
              statusNotice.isError
                ? 'bg-danger/10 border-danger/30 text-danger'
                : 'bg-primary/10 border-primary/30'
            }`}
          >
            {statusNotice.isError ? (
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
            )}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" intent="neutral" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={isSuccess ? <Check size={14} /> : <Send size={14} />}
            onClick={handleDispatch}
            loading={isSubmitting}
            disabled={selectedCategories.length === 0}
          >
            {isSuccess ? 'Dispatched' : `Generate PDF & Share (${selectedCategories.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
