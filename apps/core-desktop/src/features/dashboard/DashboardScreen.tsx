// [phase: 8D] DashboardScreen with 3-Row Layout, Modal Wiring & PDF Sales Report Generation
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SearchInput, Skeleton, Alert } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { TabContainer } from '../../components/TabContainer';
import { useDashboard } from '../../hooks/useDashboard';
import { useToast } from '../../hooks/useToast';
import { customersApi } from '../../api/customersApi';
import { purchasesApi } from '../../api/purchasesApi';
import { useInventory } from '../../hooks/useInventory';
import { KPIRows } from './components/KPIRows';
import { OverviewChartPanel } from './components/OverviewChartPanel';
import { BusinessHealthPanel } from './components/BusinessHealthPanel';
import { PatientsInTrackPanel } from './components/PatientsInTrackPanel';
import { PendingPanel } from './components/PendingPanel';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { CustomerFormModal, type CustomerFormPayload } from '../customers/components/CustomerFormModal';
import { NewStockModal } from '../inventory/components/NewStockModal';
import { CreatePODraftModal } from '../purchases/components/CreatePODraftModal';
import { ReportShareModal } from '../reports/components/ReportShareModal';
import { useAlerts } from '../alerts/useAlerts';
import type { DashboardChartMetric } from './utils/chartData';

export const DashboardScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { summary, isLoading, isError, error, refetch } = useDashboard();
  const { toast } = useToast();
  const { addItem } = useInventory();
  const { alerts, byDomain } = useAlerts();

  const [searchQuery, setSearchQuery] = React.useState('');

  // Modals state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = React.useState(false);
  const [isAddPODraftOpen, setIsAddPODraftOpen] = React.useState(false);
  const [isSalesReportModalOpen, setIsSalesReportModalOpen] = React.useState(false);
  const [isModalLoading, setIsModalLoading] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global search hotkey (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add Customer Handler
  const handleSaveCustomer = async (payload: CustomerFormPayload) => {
    setIsModalLoading(true);
    try {
      await customersApi.addCustomer({
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

      toast.success('Mteja mpya ameongezwa kikamilifu');
      setIsAddCustomerOpen(false);

      // Invalidate React Query keys so dashboard cards update instantly
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err: any) {
      toast.error(err?.message || 'Shida imetokea wakati wa kuhifadhi mteja');
    } finally {
      setIsModalLoading(false);
    }
  };

  // Add Stock Handler
  const handleSaveStock = async (payload: any) => {
    setIsModalLoading(true);
    try {
      await addItem(payload);
      toast.success('Bidhaa mpya imeongezwa kikamilifu');
      setIsAddStockOpen(false);

      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err: any) {
      toast.error(err?.message || 'Shida imetokea wakati wa kuongeza bidhaa');
    } finally {
      setIsModalLoading(false);
    }
  };

  // Add PO Draft Handler (Not PIN gated for drafts)
  const handleSavePODraft = async (
    supplierId: string,
    lines: { medicineId: string; quantity: number; unitCost: number }[]
  ) => {
    setIsModalLoading(true);
    try {
      await purchasesApi.create(
        supplierId,
        lines.map((l) => ({
          medicine_id: l.medicineId,
          quantity: l.quantity,
          unit_cost: l.unitCost,
        }))
      );
      toast.success('Rasimu ya agizo imeundwa kikamilifu');
      setIsAddPODraftOpen(false);

      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    } catch (err: any) {
      toast.error(err?.message || 'Shida imetokea wakati wa kuunda agizo');
    } finally {
      setIsModalLoading(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <TabContainer scroll>
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-[320px] w-full" />
        </div>
      </TabContainer>
    );
  }

  if (isError) {
    return (
      <TabContainer scroll>
        <div className="p-6 max-w-[1600px] mx-auto w-full">
          <Alert intent="danger" title={t('dashboard.errorLoading')}>
            <div className="flex items-center justify-between">
              <span>{error instanceof Error ? error.message : String(error)}</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-3 py-1 bg-danger text-white rounded text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                {t('dashboard.retry')}
              </button>
            </div>
          </Alert>
        </div>
      </TabContainer>
    );
  }

  return (
    <TabContainer
      scroll
      overlays={
        <>
          {/* Customer Modal */}
          <CustomerFormModal
            isOpen={isAddCustomerOpen}
            onClose={() => setIsAddCustomerOpen(false)}
            onSave={handleSaveCustomer}
            isLoading={isModalLoading}
          />

          {/* New Stock Modal */}
          <NewStockModal
            isOpen={isAddStockOpen}
            onClose={() => setIsAddStockOpen(false)}
            onAdd={handleSaveStock}
            isLoading={isModalLoading}
          />

          {/* Create PO Draft Modal */}
          <CreatePODraftModal
            isOpen={isAddPODraftOpen}
            onClose={() => setIsAddPODraftOpen(false)}
            onSave={handleSavePODraft}
            isLoading={isModalLoading}
          />

          {/* PDF Sales Report Generation & Share Modal */}
          <ReportShareModal
            isOpen={isSalesReportModalOpen}
            onClose={() => setIsSalesReportModalOpen(false)}
            activeCategory="sales"
            periodLabel="THIS MONTH"
            onShareComplete={(summaryText) => {
              toast.info(summaryText);
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-5 w-full max-w-[1600px] mx-auto p-4 min-h-0">
        {alerts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between text-xs text-amber-300">
            <span>[Dev Alerts Wire] Active alerts: {alerts.length} (Stock: {byDomain.stock.length}, Expiry: {byDomain.expiry.length}, Lab: {byDomain.lab.length}, Debts: {byDomain.debts.length}, Purchases: {byDomain.purchases.length}, Sales: {byDomain.sales.length}, Profit: {byDomain.profit.length})</span>
          </div>
        )}

        {/* Row 1: 8 KpiCards (4×2) */}
        <KPIRows summary={summary} />

        {/* Row 2: DashboardChart (2/3) | Right Rail (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Chart Panel (~2/3 width) */}
          <div className="lg:col-span-8 min-w-0">
            <OverviewChartPanel summary={summary} />
          </div>

          {/* Right Rail (~1/3 width) */}
          <div className="lg:col-span-4 flex flex-col gap-4 min-w-0">
            {/* Global Search Box at top of Right Rail */}
            <div className="relative">
              <SearchInput
                ref={searchInputRef}
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>

            {/* QuickActions: 4 compact icon+label tiles + Sales Report Share action */}
            <QuickActionsPanel
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
              onOpenAddStock={() => setIsAddStockOpen(true)}
              onOpenAddPODraft={() => setIsAddPODraftOpen(true)}
              onOpenSalesReport={() => setIsSalesReportModalOpen(true)}
            />

            {/* Zinazosubiri: aggregate pending list */}
            <PendingPanel summary={summary} />
          </div>
        </div>

        {/* Row 3: Afya ya Biashara | Wagonjwa kwenye Ufuatiliaji */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BusinessHealthPanel summary={summary} />
          <PatientsInTrackPanel patients={summary.patientsInTrack} />
        </div>
      </div>
    </TabContainer>
  );
};
