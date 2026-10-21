import * as React from 'react';
import {
  PageToolbar,
  Button,
  SearchInput,
  IconButton,
} from '@40labs/ui-components';
import { Plus, RefreshCw, ArrowDownToLine } from 'lucide-react';
import type { Customer } from '@40labs/types';
import { TabContainer } from '../../components/TabContainer';
import { useNavStore } from '../../stores/useNavStore';
import { CustomerKpiRow } from './components/CustomerKpiRow';
import { CustomerFilterBar } from './components/CustomerFilterBar';
import { SexFilter } from './components/SexFilter';
import { ActiveFilterChips } from './components/ActiveFilterChips';
import { CustomerList } from './components/CustomerList';
import { CustomerFormModal, CustomerFormPayload } from './components/CustomerFormModal';
import { DataImportModal } from '../../components/DataImportModal';
import { BulkActionBar } from './components/BulkActionBar';
import { SelectAllBanner } from './components/SelectAllBanner';
import { PatientRecordScreen } from './PatientRecordScreen';
import { useCustomers } from '../../hooks/useCustomers';
import { customersApi } from '../../api/customersApi';
import { useCustomerStats } from './hooks/useCustomerStats';
import { useCustomerSelectionStore } from './state/customerSelectionSlice';
import { useBulkArchive } from './hooks/useBulkArchive';
import { useExportCustomers } from './hooks/useExportCustomers';

export const CustomersScreen: React.FC = () => {
  const patientDetailId = useNavStore((s) => s.patientDetailId);
  const setPatientDetailId = useNavStore((s) => s.setPatientDetailId);

  const {
    customers,
    allCustomers,
    isLoading,
    isError,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    timeRange,
    setTimeRange,
    balanceFilter,
    setBalanceFilter,
    sexFilter,
    setSexFilter,
    isAddModalOpen,
    setAddModalOpen,
    addCustomer,
    updateCustomer,
  } = useCustomers();

  const stats = useCustomerStats(allCustomers);

  const selection = useCustomerSelectionStore((s) => s.selection);
  const totalMatching = useCustomerSelectionStore((s) => s.totalMatching);
  const getSelectedCount = useCustomerSelectionStore((s) => s.getCount);
  const isAllMatching = useCustomerSelectionStore((s) => s.isAllMatching);
  const selectAllMatching = useCustomerSelectionStore((s) => s.selectAllMatching);
  const clearSelection = useCustomerSelectionStore((s) => s.clear);
  const isSelected = useCustomerSelectionStore((s) => s.isSelected);

  const selectedCount = getSelectedCount();

  const { archiveCustomers, isArchiving } = useBulkArchive(() => {
    clearSelection();
    refetch();
  });

  const { exportCustomers, isExporting } = useExportCustomers();

  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

  const handleClearAll = React.useCallback(() => {
    setTimeRange('all');
    setBalanceFilter('all');
    setSexFilter('all');
    setSearchTerm('');
    clearSelection();
  }, [setTimeRange, setBalanceFilter, setSexFilter, setSearchTerm, clearSelection]);

  const handleSaveCustomer = async (payload: CustomerFormPayload) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, {
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        notes: payload.notes,
        dob: payload.dob,
        gender: payload.gender,
        bloodGroup: payload.bloodGroup,
        allergies: payload.allergies as any,
        chronicConditions: payload.chronicConditions ?? undefined,
        currentMedications: payload.currentMedications ?? undefined,
        emergencyContact: payload.emergencyContact as any,
        wardDistrict: payload.wardDistrict,
        pharmacyNotes: payload.pharmacyNotes,
      });
      setEditingCustomer(null);
    } else {
      await addCustomer({
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email || undefined,
        notes: payload.notes || undefined,
        dob: payload.dob || undefined,
        gender: payload.gender || undefined,
        bloodGroup: payload.bloodGroup || undefined,
        allergies: payload.allergies as any,
        chronicConditions: payload.chronicConditions ?? undefined,
        currentMedications: payload.currentMedications ?? undefined,
        emergencyContact: payload.emergencyContact as any,
        wardDistrict: payload.wardDistrict || undefined,
        pharmacyNotes: payload.pharmacyNotes || undefined,
      });
    }
  };

  const handleArchiveCustomer = async (id: string) => {
    await updateCustomer(id, {
      archivedAt: new Date().toISOString(),
    });
    refetch();
  };

  const existingPatientRecords = React.useMemo(() => {
    return allCustomers.map((c) => ({
      fullName: c.full_name,
      phone: c.phone,
    }));
  }, [allCustomers]);

  const handleExecuteImport = async (rows: Array<Record<string, any>>, duplicateStrategy: 'skip' | 'update' | 'new') => {
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    let rejected = 0;

    for (const row of rows) {
      try {
        const existing = allCustomers.find(
          (c) => c.phone === row.phone || c.full_name.toLowerCase() === row.fullName.toLowerCase()
        );

        if (existing) {
          if (duplicateStrategy === 'skip') {
            skipped++;
            continue;
          } else if (duplicateStrategy === 'update') {
            await customersApi.update(existing.id, {
              fullName: row.fullName,
              phone: row.phone,
              email: row.email || undefined,
              dob: row.dob || undefined,
              gender: row.gender || undefined,
              bloodGroup: row.bloodGroup || undefined,
              wardDistrict: row.address || undefined,
              notes: row.notes || undefined,
            });
            updated++;
            continue;
          }
        }

        await customersApi.create({
          fullName: row.fullName,
          phone: row.phone,
          email: row.email || undefined,
          dob: row.dob || undefined,
          gender: row.gender || undefined,
          bloodGroup: row.bloodGroup || undefined,
          wardDistrict: row.address || undefined,
          notes: row.notes || undefined,
        });
        imported++;
      } catch {
        rejected++;
      }
    }

    await refetch();
    return { imported, skipped, updated, rejected };
  };

  const handleBulkExport = async () => {
    let targetCustomers: Customer[] = [];
    if (selection.mode === 'allMatching') {
      targetCustomers = customers.filter((c) => !selection.excludedIds.has(c.id));
    } else {
      targetCustomers = customers.filter((c) => selection.ids.has(c.id));
    }
    await exportCustomers(targetCustomers);
  };

  const handleBulkArchive = async () => {
    let targetIds: string[] = [];
    if (selection.mode === 'allMatching') {
      targetIds = customers.filter((c) => !selection.excludedIds.has(c.id)).map((c) => c.id);
    } else {
      targetIds = Array.from(selection.ids);
    }

    if (targetIds.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to archive ${targetIds.length} customer(s)?`);
    if (!confirmed) return;

    const res = await archiveCustomers(targetIds);
    alert(`Archived ${res.archived}, failed ${res.failed}`);
  };

  if (patientDetailId) {
    return <PatientRecordScreen customerId={patientDetailId} />;
  }

  return (
    <TabContainer
      scroll
      toolbar={
        <div className="relative w-full flex flex-col">
          <BulkActionBar
            selectedCount={selectedCount}
            onExport={handleBulkExport}
            onArchive={handleBulkArchive}
            onClear={clearSelection}
            isArchiving={isArchiving}
            isExporting={isExporting}
          />
          <PageToolbar
            left={
              <div className="flex items-center gap-3 flex-wrap">
                <CustomerFilterBar
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  balanceFilter={balanceFilter}
                  onBalanceFilterChange={setBalanceFilter}
                  onClearAll={handleClearAll}
                  hasActiveFilters={Boolean(searchTerm || timeRange !== 'all' || balanceFilter !== 'all' || sexFilter !== 'all')}
                />
                <SexFilter sexFilter={sexFilter} onSexFilterChange={setSexFilter} />
              </div>
            }
            right={
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  leftIcon={<ArrowDownToLine size={14} />}
                  onClick={() => setIsImportModalOpen(true)}
                >
                  Import Patients
                </Button>
                <Button
                  type="button"
                  intent="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => {
                    setEditingCustomer(null);
                    setAddModalOpen(true);
                  }}
                >
                  Add Customer
                </Button>
                <SearchInput
                  className="w-64"
                  placeholder="Search name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm('')}
                />
                <IconButton
                  icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
                  label="Refresh customers"
                  intent="ghost"
                  size="sm"
                  onClick={() => refetch()}
                />
              </div>
            }
          />
          <ActiveFilterChips
            timeRange={timeRange}
            balanceFilter={balanceFilter}
            sexFilter={sexFilter}
            searchTerm={searchTerm}
            onClearTime={() => setTimeRange('all')}
            onClearBalance={() => setBalanceFilter('all')}
            onClearSex={() => setSexFilter('all')}
            onClearSearch={() => setSearchTerm('')}
            onClearAll={handleClearAll}
          />
        </div>
      }
      overlays={
        <>
          <CustomerFormModal
            isOpen={isAddModalOpen || Boolean(editingCustomer)}
            onClose={() => {
              setAddModalOpen(false);
              setEditingCustomer(null);
            }}
            onSave={handleSaveCustomer}
            editCustomer={editingCustomer}
            isLoading={false}
            allCustomers={allCustomers}
            onOpenCustomerProfile={(id) => setPatientDetailId(id)}
          />

          <DataImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            moduleType="patients"
            existingRecords={existingPatientRecords}
            onExecuteImport={handleExecuteImport}
            onImportComplete={() => {
              refetch();
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        {/* KPI Stats Bar */}
        <CustomerKpiRow stats={stats} />

        {/* Select All Banner */}
        <SelectAllBanner
          selectedCount={selectedCount}
          totalMatching={customers.length}
          isAllMatching={isAllMatching}
          onSelectAllMatching={selectAllMatching}
          onClear={clearSelection}
        />

        {/* Table Region */}
        <div className="flex-1 min-h-0">
          <CustomerList
            customers={customers}
            onViewDetails={(id) => setPatientDetailId(id)}
            onEditCustomer={(cust) => setEditingCustomer(cust)}
            onArchiveCustomer={handleArchiveCustomer}
            loading={isLoading}
            error={isError ? (error as Error) : null}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    </TabContainer>
  );
};
