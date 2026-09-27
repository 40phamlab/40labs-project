import * as React from 'react';
import {
  Modal,
  Button,
  Select,
  Textarea,
  Checkbox,
  SearchInput,
} from '@40labs/ui-components';
import { ScheduleChannel, RecipientScope } from '@40labs/types';
import { Send, Check, AlertCircle } from 'lucide-react';
import { initialCustomers } from '../../../devData/customers/customers';
import { initialUsers } from '../../../devData/users/staff';
import { ReportCategoryId, reportCategoriesConfig, DateRange } from '../config/reportCategories';
import { ReportSelectionList } from './ReportSelectionList';
import { createReportPdfBlob } from '../utils/exportReportPdf';
import { useNotifications } from '../../../hooks/useNotifications';
import { useReports } from '../../../hooks/useReports';

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

const SHARE_CHANNELS: Array<{ id: ScheduleChannel; label: string; description: string }> = [
  { id: 'whatsapp', label: 'WhatsApp', description: 'Direct message (Integration required)' },
  { id: 'gmail', label: 'Gmail / Email', description: 'SMTP email outbox (Integration required)' },
  { id: 'google_drive', label: 'Google Drive', description: 'Cloud storage sync (Integration required)' },
  { id: 'in_app', label: 'In-App Notification', description: 'Notify team members inside 40Labs Core (Active)' },
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
  const [selectedCategories, setSelectedCategories] = React.useState<ReportCategoryId[]>([activeCategory]);
  const [selectedChannels, setSelectedChannels] = React.useState<ScheduleChannel[]>(['in_app']);
  const [recipientScope, setRecipientScope] = React.useState<RecipientScope>('staff');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);

  const { createNotification } = useNotifications();
  const defaultReportsHook = useReports({ categoryId: activeCategory, dateRange });
  const getReportForCategory = getReportProp || defaultReportsHook.getReportForCategory;

  React.useEffect(() => {
    if (isOpen) {
      setSelectedCategories([activeCategory]);
      setSelectedChannels(['in_app']);
      setRecipientScope('staff');
      setSelectedRecipientIds(['user_001']);
      setMessage(`Attached report(s) for period: ${periodLabel}.`);
      setIsSubmitting(false);
      setIsSuccess(false);
      setStatusNotice(null);
    }
  }, [isOpen, activeCategory, periodLabel]);

  const contacts = React.useMemo(() => {
    let list = recipientScope === 'staff'
      ? initialUsers.map((u) => ({ id: u.id, name: u.full_name, detail: `${u.role.toUpperCase()} (Staff User)` }))
      : initialCustomers.map((c) => ({ id: c.id, name: c.full_name, detail: `${c.phone} · ${c.email || 'No email'}` }));

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q));
  }, [recipientScope, searchQuery]);

  const toggleChannel = (ch: ScheduleChannel) => {
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

    // 1. Generate real PDF Blob(s) per selected category
    const generatedBlobs: { categoryId: ReportCategoryId; blob: Blob; label: string }[] = [];

    for (const catId of selectedCategories) {
      const reportData = getReportForCategory(catId);
      const blob = createReportPdfBlob({
        title: reportData.categoryConfig.label,
        categoryLabel: reportData.categoryConfig.label,
        periodLabel,
        kpis: reportData.kpis,
        columns: reportData.tableColumns,
        rows: reportData.tableRows,
      });
      generatedBlobs.push({
        categoryId: catId,
        blob,
        label: reportData.categoryConfig.label,
      });
    }

    const hasInApp = selectedChannels.includes('in_app');
    const hasExternal = selectedChannels.some((ch) => ch !== 'in_app');
    const categoryNames = generatedBlobs.map((b) => b.label).join(', ');

    // 2. Fire real in-app notification if channel included
    if (hasInApp) {
      try {
        await createNotification({
          category: 'business',
          sender_name: 'Reports & Analytics',
          body: `Report PDF(s) generated: [${categoryNames}] for period ${periodLabel}. Cover note: "${message || 'None'}". Recipients: ${selectedRecipientIds.length} contact(s).`,
        });
      } catch (err) {
        console.error('Failed to create in-app notification:', err);
      }
    }

    // 3. Formulate status summary based on transport reality
    let summary = '';
    if (hasInApp && !hasExternal) {
      summary = `In-app notification created for ${categoryNames}.`;
    } else if (hasInApp && hasExternal) {
      summary = `In-app notification dispatched. Note: External transport (WhatsApp/Gmail/Drive) is disabled until API integrations are configured.`;
    } else {
      summary = `${generatedBlobs.length} PDF report(s) generated. Note: External transport (WhatsApp/Gmail/Drive) is disabled until API integrations are configured.`;
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setStatusNotice(summary);

    if (onShareComplete) {
      onShareComplete(summary);
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Dispatch Reports"
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
            Delivery Channels (Select at least 1)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SHARE_CHANNELS.map((ch) => {
              const active = selectedChannels.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={`p-2.5 rounded-input border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                    active
                      ? 'bg-panel-strong border-primary/50 text-text elevation-raised'
                      : 'bg-panel border-border/50 text-text-muted hover:text-text'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{ch.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[10px] text-text-muted truncate">{ch.description}</span>
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
              <option value="staff">Internal Staff / Owners</option>
              <option value="customers">Customers</option>
              <option value="all">All Contacts</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Filter Recipients</label>
            <SearchInput
              placeholder="Search recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="max-h-[140px] overflow-y-auto p-2 bg-panel rounded-card border border-border/50 flex flex-col gap-1.5">
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

        {/* Cover Note / Message Body */}
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
          <div className="p-2.5 rounded-input bg-primary/10 border border-primary/30 flex items-start gap-2 text-xs text-text">
            <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
            <span>{statusNotice}</span>
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
            {isSuccess ? 'Dispatched' : `Share ${selectedCategories.length} Report(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
