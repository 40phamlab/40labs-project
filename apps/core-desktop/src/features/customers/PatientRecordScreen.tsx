// [PHASE: MVP]
import * as React from 'react';
import { Button, Avatar, MoneyDisplay, Dropdown, DropdownMenuItem } from '@40labs/ui-components';
import { formatDate, formatPhoneTZ } from '@40labs/i18n';
import { ChevronRight, Edit3, Download, Share2, Printer, Archive, Copy, Check } from 'lucide-react';
import { useNavStore } from '../../stores/useNavStore';
import { useCustomers } from '../../hooks/useCustomers';
import { OverviewTab } from './components/tabs/OverviewTab';
import { MedicalProfileTab } from './components/tabs/MedicalProfileTab';
import { DispensingTab } from './components/tabs/DispensingTab';
import { LabResultsTab } from './components/tabs/LabResultsTab';
import { PurchasesTab } from './components/tabs/PurchasesTab';
import { PaymentsBalanceTab } from './components/tabs/PaymentsBalanceTab';
import { NotesTab } from './components/tabs/NotesTab';
import { ActivityTab } from './components/tabs/ActivityTab';
import { CustomerFormModal, CustomerFormPayload } from './components/CustomerFormModal';
import { PatientExportModal } from './components/PatientExportModal';
import { requirePin } from './components/CustomerList';

interface PatientRecordScreenProps {
  customerId: string;
}

type TabId = 'overview' | 'medical' | 'dispensing' | 'labs' | 'purchases' | 'payments' | 'notes' | 'activity';

export const PatientRecordScreen: React.FC<PatientRecordScreenProps> = ({ customerId }) => {
  const setPatientDetailId = useNavStore((s) => s.setPatientDetailId);
  const { customers, updateCustomer, isUpdating } = useCustomers();

  const customer = React.useMemo(() => {
    return customers.find((c) => c.id === customerId) || null;
  }, [customers, customerId]);

  const [activeTab, setActiveTab] = React.useState<TabId>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [exportModalMode, setExportModalMode] = React.useState<'export' | 'share'>('export');
  const [exportModalChannel, setExportModalChannel] = React.useState<'whatsapp' | 'gmail' | 'drive'>('whatsapp');
  const [copiedEmail, setCopiedEmail] = React.useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = React.useState(false);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-surface">
        <p className="text-sm text-text-muted">Customer record not found.</p>
        <Button intent="neutral" size="sm" className="mt-4" onClick={() => setPatientDetailId(null)}>
          Return to Patients
        </Button>
      </div>
    );
  }

  const handleCopyEmail = () => {
    if (customer.email) {
      navigator.clipboard.writeText(customer.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSaveEdit = async (payload: CustomerFormPayload) => {
    await updateCustomer(customer.id, {
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email || null,
      notes: payload.notes || null,
      dob: payload.dob || null,
      sex: payload.sex || null,
      bloodGroup: payload.bloodGroup || null,
      allergies: payload.allergies ? (payload.allergies as any) : null,
      chronicConditions: payload.chronicConditions || null,
      currentMedications: payload.currentMedications || null,
      emergencyContact: payload.emergencyContact ? (payload.emergencyContact as any) : null,
      wardDistrict: payload.wardDistrict || null,
      pharmacyNotes: payload.pharmacyNotes || null,
    });
    setIsEditModalOpen(false);
  };

  const handleArchive = async () => {
    const authorized = await requirePin('customer.archive');
    if (authorized) {
      await updateCustomer(customer.id, { archivedAt: new Date().toISOString() });
      setPatientDetailId(null);
    }
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'medical', label: 'Medical Profile' },
    { id: 'dispensing', label: 'Dispensing' },
    { id: 'labs', label: 'Lab Results' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'payments', label: 'Payments & Balance' },
    { id: 'notes', label: 'Notes' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface overflow-y-auto px-6 py-4 custom-scrollbar">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-4 max-w-[1200px] mx-auto w-full">
        <button
          type="button"
          onClick={() => setPatientDetailId(null)}
          className="hover:text-text transition-colors cursor-pointer"
        >
          Patients
        </button>
        <ChevronRight size={14} />
        <span className="font-bold text-text">{customer.full_name}</span>
      </div>

      {/* Sticky Header Card */}
      <div className="sticky top-0 z-20 bg-panel border border-border rounded-card p-6 shadow-xs max-w-[1200px] mx-auto w-full mb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg" name={customer.full_name} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-xl font-bold text-text tracking-tight">
                  {customer.full_name}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${customer.archived_at ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                  {customer.archived_at ? 'Archived' : 'Active Patient'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted mt-1">
                <span className="font-mono font-semibold text-text">{formatPhoneTZ(customer.phone)}</span>
                {customer.email && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-text">{customer.email}</span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-text-muted hover:text-text transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      {copiedEmail ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
                <span>Member since {formatDate(customer.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Outstanding Balance</span>
              <MoneyDisplay
                amount={customer.outstanding_balance}
                colorize={customer.outstanding_balance > 0}
                emphasis="strong"
                className="text-base font-mono mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              intent="neutral"
              size="sm"
              leftIcon={<Edit3 size={14} />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
            <Button
              intent="neutral"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={() => {
                setExportModalMode('export');
                setIsExportModalOpen(true);
              }}
            >
              Export PDF
            </Button>
            <div className="relative">
              <Dropdown
                isOpen={isShareMenuOpen}
                onClose={() => setIsShareMenuOpen(false)}
                trigger={
                  <Button
                    intent="neutral"
                    size="sm"
                    rightIcon={<Share2 size={14} />}
                    onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                  >
                    Share
                  </Button>
                }
              >
                <DropdownMenuItem
                  label="WhatsApp"
                  onClick={() => {
                    setIsShareMenuOpen(false);
                    setExportModalMode('share');
                    setExportModalChannel('whatsapp');
                    setIsExportModalOpen(true);
                  }}
                />
                <DropdownMenuItem
                  label="Email"
                  onClick={() => {
                    setIsShareMenuOpen(false);
                    setExportModalMode('share');
                    setExportModalChannel('gmail');
                    setIsExportModalOpen(true);
                  }}
                />
                <DropdownMenuItem
                  label="Google Drive"
                  onClick={() => {
                    setIsShareMenuOpen(false);
                    setExportModalMode('share');
                    setExportModalChannel('drive');
                    setIsExportModalOpen(true);
                  }}
                />
              </Dropdown>
            </div>
            <Button
              intent="neutral"
              size="sm"
              leftIcon={<Printer size={14} />}
              onClick={() => {
                setExportModalMode('export');
                setIsExportModalOpen(true);
              }}
            >
              Print
            </Button>
          </div>

          <Button
            intent="danger"
            size="sm"
            leftIcon={<Archive size={14} />}
            onClick={handleArchive}
          >
            Archive
          </Button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-border/40 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with 24px section gaps & max-width 1200 */}
      <div className="max-w-[1200px] mx-auto w-full flex-1">
        {activeTab === 'overview' && <OverviewTab customer={customer} />}
        {activeTab === 'medical' && <MedicalProfileTab customer={customer} />}
        {activeTab === 'dispensing' && <DispensingTab customer={customer} />}
        {activeTab === 'labs' && <LabResultsTab customer={customer} />}
        {activeTab === 'purchases' && <PurchasesTab customer={customer} />}
        {activeTab === 'payments' && <PaymentsBalanceTab customer={customer} />}
        {activeTab === 'notes' && <NotesTab customer={customer} onUpdateNotes={async (notes) => { await updateCustomer(customer.id, { notes }); }} />}
        {activeTab === 'activity' && <ActivityTab customer={customer} />}
      </div>

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        editCustomer={customer}
        isLoading={isUpdating}
        allCustomers={customers}
      />

      {/* Export / Share Modal */}
      <PatientExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        customer={customer}
        initialMode={exportModalMode}
        initialChannel={exportModalChannel}
      />
    </div>
  );
};
