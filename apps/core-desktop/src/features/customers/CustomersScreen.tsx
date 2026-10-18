import * as React from 'react';
import {
  PageToolbar,
  Button,
  SearchInput,
  IconButton,
} from '@40labs/ui-components';
import { Plus, RefreshCw, Upload } from 'lucide-react';
import type { Customer } from '@40labs/types';
import { TabContainer } from '../../components/TabContainer';
import { useNavStore } from '../../stores/useNavStore';
import { CustomerStatsBar } from './components/CustomerStatsBar';
import { CustomerFilterBar } from './components/CustomerFilterBar';
import { CustomerList } from './components/CustomerList';
import { CustomerFormModal, CustomerFormPayload } from './components/CustomerFormModal';
import { DataImportModal } from '../../components/DataImportModal';
import { PatientRecordScreen } from './PatientRecordScreen';
import { useCustomers } from '../../hooks/useCustomers';
import { customersApi } from '../../api/customersApi';

export const CustomersScreen: React.FC = () => {
  const patientDetailId = useNavStore((s) => s.patientDetailId);
  const setPatientDetailId = useNavStore((s) => s.setPatientDetailId);

  const {
    customers,
    isLoading,
    isError,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    isAddModalOpen,
    setAddModalOpen,
    addCustomer,
    updateCustomer,
    isAdding,
    isUpdating,
  } = useCustomers();

  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState('all');
  const [balanceFilter, setBalanceFilter] = React.useState('all');

  const activeCustomers = React.useMemo(() => {
    return customers.filter((c) => !c.archived_at);
  }, [customers]);

  const filteredCustomers = React.useMemo(() => {
    const baseList = timeRange === 'archived'
      ? customers.filter((c) => Boolean(c.archived_at))
      : activeCustomers;

    return baseList.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, '');
      const phoneDigits = c.phone.replace(/\D/g, '');

      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
        (c.email && c.email.toLowerCase().includes(q));

      let matchesTime = true;
      if (timeRange !== 'archived') {
        const createdAt = new Date(c.created_at);
        const now = new Date();

        if (timeRange === 'today') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          matchesTime = createdAt >= startOfToday;
        } else if (timeRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = createdAt >= weekAgo;
        } else if (timeRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesTime = createdAt >= monthAgo;
        }
      }

      let matchesBalance = true;
      if (balanceFilter === 'debtors') {
        matchesBalance = c.outstanding_balance > 0;
      } else if (balanceFilter === 'clear') {
        matchesBalance = c.outstanding_balance === 0;
      }

      return matchesSearch && matchesTime && matchesBalance;
    });
  }, [customers, activeCustomers, searchTerm, timeRange, balanceFilter]);

  const handleClearAll = React.useCallback(() => {
    setTimeRange('all');
    setBalanceFilter('all');
    setSearchTerm('');
  }, [setSearchTerm]);

  const handleSaveCustomer = async (payload: CustomerFormPayload) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, {
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        notes: payload.notes,
        dob: payload.dob,
        sex: payload.sex,
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
        sex: payload.sex || undefined,
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
  };

  const existingPatientRecords = React.useMemo(() => {
    return customers.map((c) => ({
      fullName: c.full_name,
      phone: c.phone,
    }));
  }, [customers]);

  const handleExecuteImport = async (rows: Array<Record<string, any>>, duplicateStrategy: 'skip' | 'update' | 'new') => {
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    let rejected = 0;

    for (const row of rows) {
      try {
        const existing = customers.find(
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
              sex: row.sex || undefined,
              bloodGroup: row.bloodGroup || undefined,
              wardDistrict: row.wardDistrict || undefined,
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
          sex: row.sex || undefined,
          bloodGroup: row.bloodGroup || undefined,
          wardDistrict: row.wardDistrict || undefined,
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

  if (patientDetailId) {
    return <PatientRecordScreen customerId={patientDetailId} />;
  }

  return (
    <TabContainer
      scroll
      toolbar={
        <PageToolbar
          left={
            <CustomerFilterBar
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              balanceFilter={balanceFilter}
              onBalanceFilterChange={setBalanceFilter}
              onClearAll={handleClearAll}
              hasActiveFilters={Boolean(searchTerm)}
            />
          }
          right={
            <div className="flex items-center gap-3">
              <Button
                type="button"
                intent="secondary"
                size="sm"
                leftIcon={<Upload size={14} />}
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
            isLoading={isAdding || isUpdating}
            allCustomers={customers}
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
        <CustomerStatsBar customers={activeCustomers} />

        {/* Table Region */}
        <div className="flex-1 min-h-0">
          <CustomerList
            customers={filteredCustomers}
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
