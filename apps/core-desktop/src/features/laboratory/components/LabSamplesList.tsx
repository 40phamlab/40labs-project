import * as React from 'react';
import {
  FilterTabs,
  DataTable,
  ColumnDefinition,
  Dropdown,
  DropdownMenuItem,
  IconButton,
  Badge,
  BadgeVariant,
  Drawer,
  ToastContainer,
  EmptyState,
} from '@40labs/ui-components';
import {
  MoreVertical,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  TestTube,
  Clock,
  User,
  ClipboardList,
} from 'lucide-react';
import type {
  LabSample,
  LabOrder,
  Customer,
  TestCatalogEntry,
  LabSampleStatus,
} from '@40labs/types';
import { formatDate, formatDateTime } from '@40labs/i18n';
import { isInLabDatePeriod } from '../utils/dateFilters';
import { ExpiryChip } from './ExpiryChip';
import { useSampleExpiry } from '../hooks/useSampleExpiry';

export type SampleTimeFilter = 'today' | 'week' | 'month' | 'expiring_expired' | 'all';

export interface LabSamplesListProps {
  samples: LabSample[];
  orders: LabOrder[];
  customers: Customer[];
  testCatalog: TestCatalogEntry[];
  onUpdateSampleStatus: (sampleId: string, status: LabSampleStatus) => Promise<unknown>;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  intent: 'info' | 'success' | 'warning' | 'danger';
}

const STATUS_BADGE_CONFIG: Record<
  LabSampleStatus,
  { label: string; variant: BadgeVariant }
> = {
  collected: { label: 'Collected', variant: 'primary' },
  used: { label: 'Used', variant: 'success' },
  insufficient: { label: 'Insufficient', variant: 'warning' },
  declined: { label: 'Declined', variant: 'danger' },
  removed: { label: 'Removed', variant: 'neutral' },
};

export const LabSamplesList: React.FC<LabSamplesListProps> = ({
  samples,
  orders,
  customers,
  testCatalog,
  onUpdateSampleStatus,
  loading,
  error,
  onRetry,
}) => {
  const [activeTimeFilter, setActiveTimeFilter] =
    React.useState<SampleTimeFilter>('today');
  const [activeMenuSampleId, setActiveMenuSampleId] = React.useState<
    string | null
  >(null);
  const [selectedSampleForDrawer, setSelectedSampleForDrawer] =
    React.useState<LabSample | null>(null);
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [pendingSampleId, setPendingSampleId] = React.useState<string | null>(null);
  const statusUpdatePending = React.useRef(false);

  const addToast = (
    message: string,
    intent: 'info' | 'success' | 'warning' | 'danger' = 'success'
  ) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, intent }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Counts follow local calendar boundaries and expiry status.
  const counts = React.useMemo(() => {
    const now = new Date();
    const all = samples.length;
    return {
      today: samples.filter((s) => isInLabDatePeriod(s.collected_at, 'today', now)).length,
      week: samples.filter((s) => isInLabDatePeriod(s.collected_at, 'week', now)).length,
      month: samples.filter((s) => isInLabDatePeriod(s.collected_at, 'month', now)).length,
      expiring_expired: samples.filter((s) => {
        const st = useSampleExpiry(s);
        return st === 'expiring_soon' || st === 'expired';
      }).length,
      all,
    };
  }, [samples]);

  const filterTabs = React.useMemo(
    () => [
      { id: 'today', label: 'Today', count: counts.today },
      { id: 'week', label: 'This week', count: counts.week },
      { id: 'month', label: 'This month', count: counts.month },
      { id: 'expiring_expired', label: 'Expiring / Expired', count: counts.expiring_expired },
      { id: 'all', label: 'All', count: counts.all },
    ],
    [counts]
  );

  // Client-side date and expiry filtering
  const filteredSamples = React.useMemo(() => {
    const now = new Date();
    return samples.filter((s) => {
      if (activeTimeFilter === 'expiring_expired') {
        const st = useSampleExpiry(s);
        return st === 'expiring_soon' || st === 'expired';
      }
      if (activeTimeFilter !== 'all') return isInLabDatePeriod(s.collected_at, activeTimeFilter, now);
      return true;
    });
  }, [samples, activeTimeFilter]);

  // Handle sample status updates (optimistic local update)
  const handleStatusChange = async (sample: LabSample, newStatus: LabSampleStatus) => {
    if (statusUpdatePending.current) return;
    statusUpdatePending.current = true;
    setPendingSampleId(sample.id);
    const statusLabels: Record<LabSampleStatus, string> = {
      collected: 'Collected',
      used: 'Used',
      insufficient: 'Insufficient',
      declined: 'Declined',
      removed: 'Removed',
    };
    try {
      await onUpdateSampleStatus(sample.id, newStatus);
      addToast(`Sample ${sample.sample_label} status updated to ${statusLabels[newStatus]}.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Could not update the laboratory sample. Please try again.';
      addToast(message, 'danger');
    } finally {
      statusUpdatePending.current = false;
      setPendingSampleId(null);
    }
  };

  // Table Columns Definition
  const columns: ColumnDefinition<LabSample>[] = React.useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const customer = order
            ? customers.find((c) => c.id === order.customer_id)
            : undefined;
          return (
            <span className="font-bold text-text">
              {customer ? (customer.full_name || 'Name not recorded') : `Patient record missing · ${order?.customer_id || `order ${item.lab_order_id}`}`}
            </span>
          );
        },
      },
      {
        key: 'category',
        header: 'Category',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const test = order
            ? testCatalog.find((t) => t.id === order.test_catalog_id)
            : undefined;
          return (
            <span className="font-medium text-text-muted">
              {test ? (test.category || test.name || 'Category not set') : `Test record missing · ${order?.test_catalog_id || `order ${item.lab_order_id}`}`}
            </span>
          );
        },
      },
      {
        key: 'contact',
        header: 'Contact',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const customer = order
            ? customers.find((c) => c.id === order.customer_id)
            : undefined;
          return (
            <span className="font-mono text-xs text-text">
              {customer?.phone || '—'}
            </span>
          );
        },
      },
      {
        key: 'type',
        header: 'Type',
        render: (item) => (
          <span className="font-mono text-xs text-text">
            {item.sample_label}
          </span>
        ),
      },
      {
        key: 'in',
        header: 'In',
        render: (item) => {
          const formatted = formatDate(item.collected_at) || 'Invalid date';
          return <span className="text-xs text-text-muted">{formatted}</span>;
        },
      },
      {
        key: 'end',
        header: 'End',
        render: (item) => {
          const formatted = item.expires_at ? formatDateTime(item.expires_at) : 'Not configured';
          return <span className="text-xs text-text-muted font-mono">{formatted}</span>;
        },
      },
      {
        key: 'exp',
        header: 'Exp',
        render: (item) => <ExpiryChip sample={item} />,
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => {
          const config =
            STATUS_BADGE_CONFIG[item.status] || STATUS_BADGE_CONFIG.collected;
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'w-16 text-right',
        render: (item) => {
          const isOpen = activeMenuSampleId === item.id;
          return (
            <Dropdown
              isOpen={isOpen}
              onClose={() => setActiveMenuSampleId(null)}
              trigger={
                <IconButton
                  icon={<MoreVertical size={16} />}
                  label="Sample actions"
                  intent="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuSampleId(isOpen ? null : item.id);
                  }}
                />
              }
            >
              <DropdownMenuItem
                label="More Info"
                disabled={!!pendingSampleId}
                icon={<Info size={14} className="text-primary" />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  setSelectedSampleForDrawer(item);
                }}
              />
              {item.status === 'collected' && <DropdownMenuItem
                label="Used"
                disabled={!!pendingSampleId}
                icon={<CheckCircle2 size={14} className="text-primary" />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'used');
                }}
              />}
              {item.status === 'collected' && <DropdownMenuItem
                label="Insufficient"
                disabled={!!pendingSampleId}
                icon={<AlertTriangle size={14} className="text-accent" />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'insufficient');
                }}
              />}
              {item.status === 'collected' && <DropdownMenuItem
                label="Decline"
                disabled={!!pendingSampleId}
                variant="danger"
                icon={<XCircle size={14} />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'declined');
                }}
              />}
              {item.status === 'collected' && <DropdownMenuItem
                label="Remove"
                disabled={!!pendingSampleId}
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'removed');
                }}
              />}
            </Dropdown>
          );
        },
      },
    ],
    [orders, customers, testCatalog, activeMenuSampleId, pendingSampleId]
  );

  const selectedOrderForDrawer = selectedSampleForDrawer
    ? orders.find((o) => o.id === selectedSampleForDrawer.lab_order_id)
    : null;
  const selectedCustomerForDrawer = selectedOrderForDrawer
    ? customers.find((c) => c.id === selectedOrderForDrawer.customer_id)
    : null;
  const selectedTestForDrawer = selectedOrderForDrawer
    ? testCatalog.find((t) => t.id === selectedOrderForDrawer.test_catalog_id)
    : null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header and Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-panel p-2 rounded-card border border-border/50 shrink-0">
        <FilterTabs
          tabs={filterTabs}
          activeTabId={activeTimeFilter}
          onChange={(id) => setActiveTimeFilter(id as SampleTimeFilter)}
        />
      </div>

      {/* Samples DataTable */}
      <div className="w-full">
        <DataTable
          data={filteredSamples}
          columns={columns}
          loading={loading}
          error={error}
          onRetry={onRetry}
          emptyState={<EmptyState variant="empty" />}
        />
      </div>

      {/* More Info Drawer */}
      <Drawer
        isOpen={!!selectedSampleForDrawer}
        onClose={() => setSelectedSampleForDrawer(null)}
        title="Sample Details"
        width="md"
      >
        {selectedSampleForDrawer && (
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-text-muted">SAMPLE ID</span>
              <span className="text-lg font-bold text-text font-mono">
                {selectedSampleForDrawer.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-panel-strong/40 rounded-card border border-border/50">
                <span className="text-xs text-text-muted block mb-1">Patient</span>
                <span className="font-bold text-text">
                  {selectedCustomerForDrawer?.full_name || 'Unknown'}
                </span>
                <span className="text-xs text-text-muted block mt-1">
                  {selectedCustomerForDrawer?.phone || 'No phone'}
                </span>
              </div>
              <div className="p-3 bg-panel-strong/40 rounded-card border border-border/50">
                <span className="text-xs text-text-muted block mb-1">Test Ordered</span>
                <span className="font-bold text-text">
                  {selectedTestForDrawer?.name || 'Unknown Test'}
                </span>
                <span className="text-xs text-text-muted block mt-1">
                  {selectedTestForDrawer?.category || 'General'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-text">Sample Collection Info</h4>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Sample Label</span>
                  <span className="font-mono font-medium text-text">
                    {selectedSampleForDrawer.sample_label}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Collected At</span>
                  <span className="font-mono text-text">
                    {formatDateTime(selectedSampleForDrawer.collected_at)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Expires At</span>
                  <span className="font-mono text-text">
                    {selectedSampleForDrawer.expires_at ? formatDateTime(selectedSampleForDrawer.expires_at) : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Viability Status</span>
                  <ExpiryChip sample={selectedSampleForDrawer} />
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Current Status</span>
                  <span className="font-medium text-text">
                    {selectedSampleForDrawer.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
