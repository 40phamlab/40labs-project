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
  Tooltip,
} from '@40labs/ui-components';
import {
  MoreVertical,
  CheckCircle,
  Share2,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import type {
  LabOrder,
  TestCatalogEntry,
  Customer,
  LabOrderStatus,
} from '@40labs/types';

export type ChannelTab = 'online' | 'forwarded' | 'unsolved';
export type TimeRange = 'today' | 'week' | 'month';

export interface LabOrdersListProps {
  orders: LabOrder[];
  testCatalog: TestCatalogEntry[];
  customers: Customer[];
  onUpdateOrderStatus: (orderId: string, newStatus: LabOrderStatus) => void;
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
  loading,
  error,
  onRetry,
}) => {
  const [activeChannel, setActiveChannel] = React.useState<ChannelTab>('unsolved');
  const [timeRange, setTimeRange] = React.useState<TimeRange>('month');
  const [activeMenuOrderId, setActiveMenuOrderId] = React.useState<string | null>(null);

  // Dialog & Toast State
  const [cancelOrderTarget, setCancelOrderTarget] = React.useState<LabOrder | null>(null);
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

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
  const unsolvedCount = React.useMemo(() => {
    return orders.filter((o) => o.status === 'unsolved').length;
  }, [orders]);

  const channelTabs = React.useMemo(
    () => [
      { id: 'online', label: 'Online', count: 0 },
      { id: 'forwarded', label: 'Forwarded', count: 0 },
      { id: 'unsolved', label: 'Unsolved', count: unsolvedCount },
    ],
    [unsolvedCount]
  );

  const timeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Last week', value: 'week' },
    { label: 'Last month', value: 'month' },
  ];

  // Filtering Logic
  const filteredOrders = React.useMemo(() => {
    // Online and Forwarded render empty-state this phase per spec
    if (activeChannel === 'online' || activeChannel === 'forwarded') {
      return [];
    }

    const now = new Date().getTime();
    return orders.filter((o) => {
      if (o.status !== 'unsolved') return false;

      const created = new Date(o.created_at).getTime();
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);

      if (timeRange === 'today') return diffDays <= 1;
      if (timeRange === 'week') return diffDays <= 7;
      if (timeRange === 'month') return diffDays <= 30;
      return true;
    });
  }, [orders, activeChannel, timeRange]);

  // Handle Solve Action (unsolved -> pending)
  const handleSolve = (order: LabOrder) => {
    onUpdateOrderStatus(order.id, 'pending');
    addToast(`Order #${order.id} solved and moved to pending queue.`, 'success');
  };

  // Handle Cancel Action (confirm modal handler)
  const handleConfirmCancel = () => {
    if (cancelOrderTarget) {
      // Question to Sairiamu: Cancel isn't in the PIN-gated action list; flag to confirm if turning down a paid test should require PIN.
      onUpdateOrderStatus(cancelOrderTarget.id, 'cancelled');
      addToast(`Order #${cancelOrderTarget.id} turned down and cancelled.`, 'danger');
    }
    setCancelOrderTarget(null);
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
            <span className="font-bold text-text">
              {customer?.full_name || 'Guest Patient'}
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
              {test?.category || 'General'}
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
          const formatted = new Date(item.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
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
              <DropdownMenuItem
                label="Solve"
                icon={<CheckCircle size={14} className="text-primary" />}
                onClick={() => {
                  setActiveMenuOrderId(null);
                  handleSolve(item);
                }}
              />

              <Tooltip content="Coming soon — patient ordering and inter-lab routing required" position="left">
                <div className="w-full">
                  <DropdownMenuItem
                    label="Forward"
                    icon={<Share2 size={14} />}
                    disabled
                  />
                </div>
              </Tooltip>

              <Tooltip content="Coming soon — patient messaging required" position="left">
                <div className="w-full">
                  <DropdownMenuItem
                    label="Contact"
                    icon={<MessageSquare size={14} />}
                    disabled
                  />
                </div>
              </Tooltip>

              <DropdownMenuItem
                label="Cancel"
                variant="danger"
                icon={<XCircle size={14} />}
                onClick={() => {
                  setActiveMenuOrderId(null);
                  setCancelOrderTarget(item);
                }}
              />
            </Dropdown>
          );
        },
      },
    ],
    [customers, testCatalog, activeMenuOrderId]
  );

  const getEmptyMessage = () => {
    if (activeChannel === 'online') {
      return 'Coming soon — this will show online-ordered tests once patient ordering ships';
    }
    if (activeChannel === 'forwarded') {
      return 'Coming soon — this will show online-ordered tests once patient ordering ships';
    }
    return 'No unsolved orders found for the selected time range.';
  };

  const channelLabelMap: Record<ChannelTab, string> = {
    online: 'Online',
    forwarded: 'Forwarded',
    unsolved: 'Unsolved',
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
        <p className="text-xs text-text-muted">
          Manage laboratory test orders, resolve issues, or route requisitions.
        </p>
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
        onConfirm={handleConfirmCancel}
        title="Turn down this test?"
        message={`Are you sure you want to turn down order #${cancelOrderTarget?.id}? This will mark the test status as cancelled.`}
        confirmText="Confirm Cancel"
        cancelText="Keep Order"
        intent="danger"
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
