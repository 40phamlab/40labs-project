import * as React from 'react';
import {
  KPITile,
  Button,
  DataTable,
  ColumnDefinition,
  StatusBadge,
  StatusType,
  IconButton,
  Dropdown,
  DropdownMenuItem,
} from '@40labs/ui-components';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  MoreVertical,
  Eye,
} from 'lucide-react';
import type {
  LabOrder,
  LabSample,
  LabResult,
  TestCatalogEntry,
  Customer,
  LabOrderStatus,
} from '@40labs/types';
import { NewLabOrderModal } from './NewLabOrderModal';

export const DEFAULT_LAB_SLA_HOURS = 2;

export interface LabDashboardProps {
  orders: LabOrder[];
  samples: LabSample[];
  results: LabResult[];
  testCatalog: TestCatalogEntry[];
  customers: Customer[];
  onAddOrder: (customerId: string, testCatalogId: string) => Promise<void> | void;
  onViewOrder?: (orderId: string) => void;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
  isCreatingOrder?: boolean;
}

const statusBadgeMap: Record<LabOrderStatus, { status: StatusType; label: string }> = {
  pending: { status: 'pending', label: 'Pending' },
  sample_collected: { status: 'warning', label: 'Sample Collected' },
  result_entered: { status: 'warning', label: 'Result Entered' },
  report_ready: { status: 'success', label: 'Report Ready' },
  unsolved: { status: 'error', label: 'Unsolved' },
  cancelled: { status: 'inactive', label: 'Cancelled' },
};

export const LabDashboard: React.FC<LabDashboardProps> = ({
  orders,
  samples,
  results,
  testCatalog,
  customers,
  onAddOrder,
  onViewOrder,
  loading,
  error,
  onRetry,
  isCreatingOrder,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeMenuOrderId, setActiveMenuOrderId] = React.useState<string | null>(null);

  // Computed KPI Metrics
  const pendingCount = React.useMemo(() => {
    return orders.filter((o) => o.status === 'pending').length;
  }, [orders]);

  const overdueTatCount = React.useMemo(() => {
    const now = Date.now();
    return orders.filter((o) => {
      if (o.status !== 'pending' && o.status !== 'sample_collected') return false;
      const created = new Date(o.created_at).getTime();
      const elapsedHours = (now - created) / (1000 * 60 * 60);
      return elapsedHours > DEFAULT_LAB_SLA_HOURS;
    }).length;
  }, [orders]);

  const criticalValsCount = React.useMemo(() => {
    return results.filter((r) => r.is_out_of_range && !r.override_authorized_by_user_id).length;
  }, [results]);

  const completedCount = React.useMemo(() => {
    return orders.filter((o) => o.status === 'report_ready').length;
  }, [orders]);

  // Recently Feed Data — exclude cancelled orders
  const recentOrders = React.useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [orders]);

  // Table Columns
  const columns: ColumnDefinition<LabOrder>[] = React.useMemo(
    () => [
      {
        key: 'test',
        header: 'Test',
        render: (item) => {
          const test = testCatalog.find((t) => t.id === item.test_catalog_id);
          return (
            <div className="flex flex-col">
              <span className="font-bold text-text">{test?.name || 'Unknown Test'}</span>
              <span className="text-[10px] text-text-muted">{test?.category || 'General'}</span>
            </div>
          );
        },
      },
      {
        key: 'patient',
        header: 'Patient',
        render: (item) => {
          const customer = customers.find((c) => c.id === item.customer_id);
          return (
            <div className="flex flex-col">
              <span className="font-medium text-text">{customer?.full_name || 'Guest Patient'}</span>
              <span className="text-[10px] font-mono text-text-muted">{customer?.phone || '—'}</span>
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => {
          const badgeConfig = statusBadgeMap[item.status] || {
            status: 'inactive' as StatusType,
            label: item.status,
          };
          return <StatusBadge status={badgeConfig.status} label={badgeConfig.label} />;
        },
      },
      {
        key: 'test_id',
        header: 'Test ID',
        render: (item) => (
          <span className="font-mono text-[11px] text-text-muted">{item.id}</span>
        ),
      },
      {
        key: 'sample_id',
        header: 'Sample ID',
        render: (item) => {
          const sample = samples.find((s) => s.lab_order_id === item.id);
          return (
            <span className="font-mono text-[11px] text-text-muted">
              {sample ? sample.sample_label : '—'}
            </span>
          );
        },
      },
      {
        key: 'action',
        header: 'Action',
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
                  label="Actions menu"
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
                label="View"
                icon={<Eye size={14} />}
                onClick={() => {
                  setActiveMenuOrderId(null);
                  onViewOrder?.(item.id);
                }}
              />
            </Dropdown>
          );
        },
      },
    ],
    [testCatalog, customers, samples, activeMenuOrderId, onViewOrder]
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* KPI Tiles Grid Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <KPITile
          title="Pending"
          value={pendingCount}
          tone="default"
          icon={<Clock size={18} />}
          subtext="Awaiting specimen / processing"
        />
        <KPITile
          title="Overdue TAT"
          value={overdueTatCount}
          tone="danger"
          icon={<AlertTriangle size={18} />}
          subtext={`> ${DEFAULT_LAB_SLA_HOURS}h SLA turnaround`}
        />
        <KPITile
          title="Critical Vals"
          value={criticalValsCount}
          tone="danger"
          icon={<AlertCircle size={18} />}
          subtext="Out-of-range awaiting review"
        />
        <KPITile
          title="Completed"
          value={completedCount}
          tone="primary"
          icon={<CheckCircle2 size={18} />}
          subtext="Lab reports ready"
        />
      </div>

      {/* Recently Feed Section Header & Primary CTA */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-text">Recently Requisitions</h2>
            <p className="text-xs text-text-muted">
              Real-time activity feed of laboratory requisitions and processing status.
            </p>
          </div>

          <Button
            type="button"
            intent="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            New Test
          </Button>
        </div>

        {/* Recently DataTable */}
        <div className="w-full">
          <DataTable
            data={recentOrders}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={onRetry}
            emptyMessage="No laboratory requisitions found."
          />
        </div>
      </div>

      {/* New Lab Order Modal */}
      <NewLabOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddOrder}
        customers={customers}
        testCatalog={testCatalog}
        isLoading={isCreatingOrder}
      />
    </div>
  );
};
