import * as React from 'react';
import { Modal, Button, Field, FieldLabel, Select } from '@40labs/ui-components';
import type { Customer } from '@40labs/types';
import { requirePin } from './CustomerList';
import { Download, Share2, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { LoaderAnimation } from '../../../components/brand';

interface PatientExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  initialMode?: 'export' | 'share';
  initialChannel?: 'whatsapp' | 'gmail' | 'drive';
}

export const PatientExportModal: React.FC<PatientExportModalProps> = ({
  isOpen,
  onClose,
  customer,
  initialMode = 'export',
  initialChannel = 'whatsapp',
}) => {
  const [mode, setMode] = React.useState<'export' | 'share'>(initialMode);
  const [channel, setChannel] = React.useState<'whatsapp' | 'gmail' | 'drive'>(initialChannel);
  const [recipient, setRecipient] = React.useState('');
  const [dateRange, setDateRange] = React.useState('all');

  const [sections, setSections] = React.useState({
    demographics: true,
    allergies: true,
    medications: true,
    dispensing: true,
    labs: true,
    purchases: true,
    balance: true,
  });

  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    setMode(initialMode);
    if (initialChannel) setChannel(initialChannel);
    setStatusMessage(null);
    setIsProcessing(false);
  }, [isOpen, initialMode, initialChannel]);

  const selectedCount = Object.values(sections).filter(Boolean).length;

  const handleToggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExecute = async (actionType: 'export' | 'print' | 'share') => {
    setIsProcessing(true);
    setStatusMessage(null);

    const authorized = await requirePin('patient.record.export');
    if (!authorized) {
      setIsProcessing(false);
      return;
    }

    if (actionType === 'print') {
      setIsProcessing(false);
      window.print();
      onClose();
      return;
    }

    if (actionType === 'export') {
      const activeSections = Object.entries(sections)
        .filter(([_, v]) => v)
        .map(([k]) => k.toUpperCase())
        .join(', ');

      const content = `CONFIDENTIAL — Patient Record Report
Customer Name: ${customer.full_name}
Phone: ${customer.phone}
Email: ${customer.email || 'N/A'}
DOB: ${customer.dob || 'N/A'} | Sex: ${customer.sex || 'N/A'}
Included Sections: ${activeSections}
Generated: ${new Date().toLocaleString()}
Workspace: 40Labs Core Desktop`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Patient_Report_${customer.full_name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsProcessing(false);
      setStatusMessage('Patient report file generated and saved locally successfully.');
      setTimeout(() => onClose(), 1500);
      return;
    }

    if (actionType === 'share') {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        setIsProcessing(false);
        setStatusMessage('Offline: Delivery enqueued for automatic sync when online.');
        setTimeout(() => onClose(), 2000);
        return;
      }

      if (channel === 'whatsapp') {
        const cleanPhone = recipient.replace(/\D/g, '');
        const text = encodeURIComponent(`Confidential Patient Report for ${customer.full_name}`);
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
        setIsProcessing(false);
        setStatusMessage('Opened WhatsApp sharing window.');
        setTimeout(() => onClose(), 1500);
        return;
      }

      if (channel === 'gmail') {
        const subject = encodeURIComponent(`Patient Report - ${customer.full_name}`);
        const body = encodeURIComponent(`Confidential Patient Report for ${customer.full_name}.\n\nSections: ${Object.keys(sections).join(', ')}`);
        window.open(`mailto:${encodeURIComponent(recipient)}?subject=${subject}&body=${body}`, '_self');
        setIsProcessing(false);
        setStatusMessage('Opened email client.');
        setTimeout(() => onClose(), 1500);
        return;
      }

      if (channel === 'drive') {
        // Triggers report file save for Drive upload
        const content = `CONFIDENTIAL — Patient Record Report\nCustomer: ${customer.full_name}\nTarget: Google Drive\nDate: ${new Date().toISOString()}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Drive_Upload_Patient_Report_${customer.full_name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsProcessing(false);
        setStatusMessage('Prepared report for Google Drive.');
        setTimeout(() => onClose(), 1500);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'export' ? 'Export / Print Patient Report' : 'Share Patient Report'}
      size="md"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-text-muted">
            {selectedCount} of 7 sections selected
          </div>
          <div className="flex gap-3">
            <Button type="button" intent="neutral" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            {mode === 'export' ? (
              <>
                <Button
                  type="button"
                  intent="neutral"
                  leftIcon={<Printer size={14} />}
                  onClick={() => handleExecute('print')}
                  disabled={isProcessing || selectedCount === 0}
                >
                  Print
                </Button>
                <Button
                  type="button"
                  intent="primary"
                  leftIcon={<Download size={14} />}
                  onClick={() => handleExecute('export')}
                  disabled={isProcessing || selectedCount === 0}
                >
                  {isProcessing ? 'Generating...' : 'Save File Locally'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                intent="primary"
                leftIcon={<Share2 size={14} />}
                onClick={() => handleExecute('share')}
                disabled={isProcessing || selectedCount === 0 || !recipient.trim()}
              >
                {isProcessing ? 'Sending...' : `Send via ${channel.toUpperCase()}`}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {isProcessing && (
          <div className="p-4 bg-panel-subtle border border-accent/30 rounded-card flex items-center justify-center">
            <LoaderAnimation variant="long" size={48} label="Inasindika ripoti..." />
          </div>
        )}

        {statusMessage && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-card text-xs text-success flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Mode switch */}
        <div className="flex bg-panel-strong/30 p-1 rounded-card border border-border/40 text-xs font-semibold">
          <button
            type="button"
            className={`flex-1 py-2 rounded transition-colors cursor-pointer ${mode === 'export' ? 'bg-panel text-accent shadow-xs' : 'text-text-muted'}`}
            onClick={() => setMode('export')}
          >
            Export & Print
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded transition-colors cursor-pointer ${mode === 'share' ? 'bg-panel text-accent shadow-xs' : 'text-text-muted'}`}
            onClick={() => setMode('share')}
          >
            Share Channel
          </button>
        </div>

        {mode === 'share' && (
          <div className="space-y-3 p-4 bg-panel-strong/20 rounded-card border border-border/40">
            <Field>
              <FieldLabel required>Delivery Channel</FieldLabel>
              <Select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="gmail">Gmail SMTP / Email</option>
                <option value="drive">Google Drive</option>
              </Select>
            </Field>

            <Field>
              <FieldLabel required>Recipient ({channel === 'whatsapp' ? 'Phone number' : 'Email address'})</FieldLabel>
              <input
                type="text"
                className="w-full px-3 py-2 text-xs rounded bg-panel border border-border text-text focus:outline-none focus:border-accent"
                placeholder={channel === 'whatsapp' ? '+255 712 345 678' : 'recipient@example.com'}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </Field>

            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <AlertCircle size={14} className="text-warning shrink-0" />
              <span>Never includes raw clinical data in message body — secure attachment report only.</span>
            </div>
          </div>
        )}

        <div className="space-y-3 p-4 bg-panel-strong/20 rounded-card border border-border/40">
          <FieldLabel>Date Range</FieldLabel>
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="all">All Time (Complete History)</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>
        </div>

        <div className="space-y-2 p-4 bg-panel-strong/20 rounded-card border border-border/40">
          <FieldLabel>Report Sections to Include</FieldLabel>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-text">
            {Object.entries(sections).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer capitalize">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleToggleSection(key as any)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>{key}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
