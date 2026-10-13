import * as React from 'react';
import {
  FilterTabs,
  SegmentedControl,
  DataTable,
  ColumnDefinition,
  Dropdown,
  DropdownMenuItem,
  IconButton,
  ConfirmDialog,
  ToastContainer,
} from '@40labs/ui-components';
import {
  MoreVertical,
  XCircle,
  TestTube,
  FileCheck,
} from 'lucide-react';
import type {
  LabOrder,
  TestCatalogEntry,
  Customer,
  LabOrderStatus,
} from '@40labs/types';
import { formatDate } from '@40labs/i18n';
import { isInLabDatePeriod } from '../utils/dateFilters';

export type ChannelTab = 'active' | 'completed' | 'all' | 'cancelled';
export type TimeRange = 'today' | 'week' | 'month' | 'all';

export interface LabOrdersListProps {
  orders: LabOrder[];
  testCatalog: TestCatalogEntry[];
  customers: Customer[];
  onUpdateOrderStatus: (orderId: string, newStatus: LabOrderStatus) => Promise<unknown>;
  onCollectSample: (order: LabOrder) => void;
  onEnterResult: (order: LabOrder) => void;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  intent: 'info' | 'success' | 'warning' | 'danger';
}

export const LabOrdersList: React.FC<LabOrdersListProps> = ({
  orders,
  testCatalog,
  customers,
  onUpdateOrderStatus,
  onCollectSample,
  onEnterResult,
  loading,
  error,
  onRetry,
}) => {
  const [activeChannel, setActiveChannel] = React.useState<ChannelTab>('active');
  const [timeRange, setTimeRange] = React.useState<TimeRange>('all');
  const [activeMenuOrderId, setActiveMenuOrderId] = React.useState<string | null>(null);

  // Dialog & Toast State
  const [cancelOrderTarget, setCancelOrderTarget] = React.useState<LabOrder | null>(null);
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
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

  // Counts for Channel FilterTabs
  const completedCount = orders.filter((o) => o.status === 'report_ready' || o.status === 'result_entered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const channelTabs = React.useMemo(
    () => [
      { id: 'active', label: 'Active', count: orders.filter((o) => !['report_ready', 'result_entered', 'cancelled'].includes(o.status)).length },
      { id: 'completed', label: 'Completed', count: completedCount },
      { id: 'all', label: 'All', count: orders.length },
      { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
    ],
    [orders, completedCount, cancelledCount]
  );

  const timeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Last week', value: 'week' },
    { label: 'Last month', value: 'month' },
    { label: 'All time', value: 'all' },
  ];

  // Filtering Logic
  const filteredOrders = React.useMemo(() => {
    const now = new Date().getTime();
    return orders.filter((o) => {
      const isCompleted = o.status === 'report_ready' || o.status === 'result_entered';
      if (activeChannel === 'active' && (isCompleted || o.status === 'cancelled')) return false;
      if (activeChannel === 'completed' && !isCompleted) return false;
      if (activeChannel === 'cancelled' && o.status !== 'cancelled') return false;

      if (timeRange !== 'all' && !isInLabDatePeriod(o.created_at, timeRange, new Date(now))) return false;
      if (timeRange === 'all') return true;
      return true;
    });
  }, [orders, activeChannel, timeRange]);

  // Handle Cancel Action (confirm modal handler)
  const handleConfirmCancel = async () => {
    if (!cancelOrderTarget || statusUpdatePending.current) return;
    statusUpdatePending.current = true;
    setIsUpdatingStatus(true);
    try {
      await onUpdateOrderStatus(cancelOrderTarget.id, 'cancelled');
      addToast(`Order #${cancelOrderTarget.id} turned down and cancelled.`, 'success');
      setCancelOrderTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Could not update the laboratory order. Please try again.';
      addToast(message, 'danger');
    } finally {
      statusUpdatePending.current = false;
      setIsUpdatingStatus(false);
    }
  };

  // Table Columns
  const columns: ColumnDefinition<LabOrder>[] = React.useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (item) => {
          const customer = customers.find((c) => c.id === item.customer_id);
          return (
            <span className="font-bold text-text" title={`Customer reference: ${item.customer_id}`}>
              {customer ? (customer.full_name || 'Name not recorded') : `Patient record missing · ${item.customer_id}`}
            </span>
          );
        },
      },
      {
        key: 'category',
        header: 'Category',
        render: (item) => {
          const test = testCatalog.find((t) => t.id === item.test_catalog_id);
          return (
            <span className="font-medium text-text-muted">
              {test ? (test.category || 'Category not set') : `Test record missing · ${item.test_catalog_id}`}
            </span>
          );
        },
      },
      {
        key: 'contact',
        header: 'Contact',
        render: (item) => {
          const customer = customers.find((c) => c.id === item.customer_id);
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
        render: () => (
          <span className="font-mono text-xs text-text-muted">
            —
          </span>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        render: (item) => {
          const formatted = formatDate(item.created_at) || 'Invalid date';
          return <span className="text-xs text-text-muted">{formatted}</span>;
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'w-16 text-right',
        render: (item) => {
          const isOpen = activeMenuOrderId === item.id;
          return (
            <Dropdown
              isOpen={isOpen}
              onClose={() => setActiveMenuOrderId(null)}
              trigger={
                <IconButton
                  icon={<MoreVertical size={16} />}
                  label="Order actions"
                  intent="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuOrderId(isOpen ? null : item.id);
                  }}
                />
              }
            >
              {item.status === 'pending' && <DropdownMenuItem label="Collect sample" icon={<TestTube size={14} className="text-primary" />} onClick={() => { setActiveMenuOrderId(null); onCollectSample(item); }} />}
              {item.status === 'sample_collected' && <DropdownMenuItem label="Enter result" icon={<FileCheck size={14} className="text-primary" />} onClick={() => { setActiveMenuOrderId(null); onEnterResult(item); }} />}

              {!['report_ready', 'result_entered', 'cancelled'].includes(item.status) && <DropdownMenuItem
                label="Cancel"
                variant="danger"
                icon={<XCircle size={14} />}
                onClick={() => {
                  setActiveMenuOrderId(null);
                  setCancelOrderTarget(item);
                }}
              />}
            </Dropdown>
          );
        },
      },
    ],
    [customers, testCatalog, activeMenuOrderId, onCollectSample, onEnterResult]
  );

  const getEmptyMessage = () => {
    return 'No orders in this view';
  };

  const channelLabelMap: Record<ChannelTab, string> = {
    active: 'Active', completed: 'Completed', all: 'All', cancelled: 'Cancelled',
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Filter Bar with Two Independent Axes */}
      <div className="flex items-center gap-4 bg-panel p-2 rounded-card border border-border/50 shrink-0">
        <FilterTabs
          tabs={channelTabs}
          activeTabId={activeChannel}
          onChange={(id) => setActiveChannel(id as ChannelTab)}
        />

        <div className="h-6 border-l border-border/40 my-auto" />

        <SegmentedControl
          options={timeOptions}
          value={timeRange}
          onChange={(val) => setTimeRange(val as TimeRange)}
          className="w-64"
        />
      </div>

      {/* Section Header Echoing Active Tab */}
      <div className="shrink-0">
        <h2 className="text-base font-bold text-text">
          {channelLabelMap[activeChannel]} Orders
        </h2>
      </div>

      {/* Orders DataTable */}
      <div className="w-full">
        <DataTable
          data={filteredOrders}
          columns={columns}
          loading={loading}
          error={error}
          onRetry={onRetry}
          emptyMessage={getEmptyMessage()}
        />
      </div>

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!cancelOrderTarget}
        onClose={() => setCancelOrderTarget(null)}
        onConfirm={() => { void handleConfirmCancel(); }}
        title="Turn down this test?"
        message={`Are you sure you want to turn down order #${cancelOrderTarget?.id}? This will mark the test status as cancelled.`}
        confirmText="Confirm Cancel"
        cancelText="Keep Order"
        intent="danger"
        loading={isUpdatingStatus}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
