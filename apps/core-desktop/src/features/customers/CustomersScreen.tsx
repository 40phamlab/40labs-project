import * as React from 'react';
import {
  PageToolbar,
  Button,
  SearchInput,
  IconButton,
} from '@40labs/ui-components';
import { Plus, RefreshCw } from 'lucide-react';
import type { Customer } from '@40labs/types';
import { TabContainer } from '../../components/TabContainer';
import { useNavStore } from '../../stores/useNavStore';
import { CustomerStatsBar } from './components/CustomerStatsBar';
import { CustomerFilterBar } from './components/CustomerFilterBar';
import { CustomerList } from './components/CustomerList';
import { CustomerFormModal, CustomerFormPayload } from './components/CustomerFormModal';
import { PatientRecordScreen } from './PatientRecordScreen';
import { useCustomers } from '../../hooks/useCustomers';

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
  const [timeRange, setTimeRange] = React.useState('all');
  const [balanceFilter, setBalanceFilter] = React.useState('all');

  const activeCustomers = React.useMemo(() => {
    return customers.filter((c) => !c.archived_at);
  }, [customers]);

  const filteredCustomers = React.useMemo(() => {
    return activeCustomers.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q));

      let matchesTime = true;
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

      let matchesBalance = true;
      if (balanceFilter === 'debtors') {
        matchesBalance = c.outstanding_balance > 0;
      } else if (balanceFilter === 'clear') {
        matchesBalance = c.outstanding_balance === 0;
      }

      return matchesSearch && matchesTime && matchesBalance;
    });
  }, [activeCustomers, searchTerm, timeRange, balanceFilter]);

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
      setEditingCustomer(null);
    } else {
      await addCustomer({
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        notes: payload.notes,
        dob: payload.dob,
        sex: payload.sex,
        bloodGroup: payload.bloodGroup,
        allergies: payload.allergies as any,
        chronicConditions: payload.chronicConditions,
        currentMedications: payload.currentMedications,
        emergencyContact: payload.emergencyContact as any,
        wardDistrict: payload.wardDistrict,
        pharmacyNotes: payload.pharmacyNotes,
      });
    }
  };

  const handleArchiveCustomer = async (id: string) => {
    await updateCustomer(id, {
      archivedAt: new Date().toISOString(),
    });
  };

  if (patientDetailId) {
    return <PatientRecordScreen customerId={patientDetailId} />;
  }

  return (
    <TabContainer
      toolbar={
        <PageToolbar
          left={
            <CustomerFilterBar
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              balanceFilter={balanceFilter}
              onBalanceFilterChange={setBalanceFilter}
              onClearAll={handleClearAll}
            />
          }
          right={
            <div className="flex items-center gap-3">
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
      }
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0 w-full overflow-hidden">
        {/* KPI Stats Bar */}
        <CustomerStatsBar customers={activeCustomers} />

        {/* Table Region */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
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
