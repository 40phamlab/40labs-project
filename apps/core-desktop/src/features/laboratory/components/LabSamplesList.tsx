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

/**
 * Standard Turnaround Time SLA constant in hours.
 * Reused by Overdue TAT KPI calculations across Lab screens.
 */
export const TAT_SLA_HOURS = 24;

export type SampleTimeFilter = 'recently' | 'month' | 'all';

export interface LabSamplesListProps {
  samples: LabSample[];
  orders: LabOrder[];
  customers: Customer[];
  testCatalog: TestCatalogEntry[];
  onUpdateSampleStatus: (sampleId: string, status: LabSampleStatus) => void;
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
    React.useState<SampleTimeFilter>('recently');
  const [activeMenuSampleId, setActiveMenuSampleId] = React.useState<
    string | null
  >(null);
  const [selectedSampleForDrawer, setSelectedSampleForDrawer] =
    React.useState<LabSample | null>(null);
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

  // Compute counts for FilterTabs based on collected_at
  const counts = React.useMemo(() => {
    const now = Date.now();
    let recently = 0;
    let month = 0;
    const all = samples.length;

    for (const s of samples) {
      const collectedTime = new Date(s.collected_at).getTime();
      const diffDays = (now - collectedTime) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) recently++;
      if (diffDays <= 30) month++;
    }

    return { recently, month, all };
  }, [samples]);

  const filterTabs = React.useMemo(
    () => [
      { id: 'recently', label: 'Recently', count: counts.recently },
      { id: 'month', label: 'Last month', count: counts.month },
      { id: 'all', label: 'All', count: counts.all },
    ],
    [counts]
  );

  // Client-side date filtering on collected_at
  const filteredSamples = React.useMemo(() => {
    const now = Date.now();
    return samples.filter((s) => {
      const collectedTime = new Date(s.collected_at).getTime();
      const diffDays = (now - collectedTime) / (1000 * 60 * 60 * 24);

      if (activeTimeFilter === 'recently') return diffDays <= 7;
      if (activeTimeFilter === 'month') return diffDays <= 30;
      return true;
    });
  }, [samples, activeTimeFilter]);

  // Handle sample status updates (optimistic local update)
  const handleStatusChange = (sample: LabSample, newStatus: LabSampleStatus) => {
    // Question to Sairiamu: Should "Remove" or sample status changes require a PIN?
    // Sample status changes aren't in GOTCHAS.md's PIN-gated action list, so updating status directly.
    onUpdateSampleStatus(sample.id, newStatus);
    const statusLabels: Record<LabSampleStatus, string> = {
      collected: 'Collected',
      used: 'Used',
      insufficient: 'Insufficient',
      declined: 'Declined',
      removed: 'Removed',
    };
    addToast(
      `Sample ${sample.sample_label} status updated to ${statusLabels[newStatus]}.`,
      newStatus === 'declined' || newStatus === 'removed' ? 'danger' : 'success'
    );
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
              {customer?.full_name || 'Guest Patient'}
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
              {test?.category || test?.name || 'General'}
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
          const formatted = new Date(item.collected_at).toLocaleDateString(
            'en-GB',
            {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }
          );
          return <span className="text-xs text-text-muted">{formatted}</span>;
        },
      },
      {
        key: 'end',
        header: 'End',
        render: (item) => {
          const endTime = new Date(
            new Date(item.collected_at).getTime() +
              TAT_SLA_HOURS * 60 * 60 * 1000
          );
          const formatted = endTime.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          return <span className="text-xs text-text-muted">{formatted}</span>;
        },
      },
      {
        key: 'exp',
        header: 'Exp',
        render: () => (
          // Question to Sairiamu: Exp (sample viability) is NOT a stored field per current schema;
          // rendering '—'. Flagging whether this needs its own column or is derived from test_catalog_entry per-test.
          <span className="text-xs text-text-muted font-mono">—</span>
        ),
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
                icon={<Info size={14} className="text-primary" />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  setSelectedSampleForDrawer(item);
                }}
              />
              <DropdownMenuItem
                label="Used"
                icon={<CheckCircle2 size={14} className="text-primary" />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'used');
                }}
              />
              <DropdownMenuItem
                label="Insufficient"
                icon={<AlertTriangle size={14} className="text-accent" />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'insufficient');
                }}
              />
              <DropdownMenuItem
                label="Decline"
                variant="danger"
                icon={<XCircle size={14} />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'declined');
                }}
              />
              <DropdownMenuItem
                label="Remove"
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() => {
                  setActiveMenuSampleId(null);
                  handleStatusChange(item, 'removed');
                }}
              />
            </Dropdown>
          );
        },
      },
    ],
    [orders, customers, testCatalog, activeMenuSampleId]
  );

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

      <div className="shrink-0">
        <h2 className="text-base font-bold text-text">Lab Samples</h2>
        <p className="text-xs text-text-muted">
          Track specimen intake, status lifecycle, SLA turnarounds, and processing state.
        </p>
      </div>

      {/* Samples DataTable */}
      <div className="w-full">
        <DataTable
          data={filteredSamples}
          columns={columns}
          loading={loading}
          error={error}
          onRetry={onRetry}
          emptyMessage="No laboratory samples found for the selected time range."
        />
      </div>

      {/* More Info Drawer */}
      <Drawer
        isOpen={!!selectedSampleForDrawer}
        onClose={() => setSelectedSampleForDrawer(null)}
        title="Sample Details"
        size="md"
      >
        {selectedSampleForDrawer &&
          (() => {
            const order = orders.find(
              (o) => o.id === selectedSampleForDrawer.lab_order_id
            );
            const customer = order
              ? customers.find((c) => c.id === order.customer_id)
              : undefined;
            const test = order
              ? testCatalog.find((t) => t.id === order.test_catalog_id)
              : undefined;
            const statusConfig =
              STATUS_BADGE_CONFIG[selectedSampleForDrawer.status] ||
              STATUS_BADGE_CONFIG.collected;

            return (
              <div className="flex flex-col gap-6 text-xs text-text">
                {/* Sample Header Section */}
                <div className="flex items-center justify-between p-3 rounded-card bg-panel-strong/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <TestTube size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text">
                        {selectedSampleForDrawer.sample_label}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono">
                        ID: {selectedSampleForDrawer.id}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Specimen Info */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Clock size={12} /> Intake & Collection
                  </h3>
                  <div className="p-3 rounded-card bg-panel/40 border border-border/40 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Collected At (In):</span>
                      <span className="font-medium">
                        {new Date(
                          selectedSampleForDrawer.collected_at
                        ).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">
                        Target Completion (End):
                      </span>
                      <span className="font-medium">
                        {new Date(
                          new Date(
                            selectedSampleForDrawer.collected_at
                          ).getTime() +
                            TAT_SLA_HOURS * 60 * 60 * 1000
                        ).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">TAT SLA Target:</span>
                      <span className="font-mono">{TAT_SLA_HOURS} Hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">
                        Sample Viability (Exp):
                      </span>
                      <span className="font-mono text-text-muted">—</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Collected By User:</span>
                      <span className="font-mono">
                        {selectedSampleForDrawer.collected_by_user_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linked Test & Order */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <ClipboardList size={12} /> Linked Requisition
                  </h3>
                  <div className="p-3 rounded-card bg-panel/40 border border-border/40 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Test Name:</span>
                      <span className="font-bold">
                        {test?.name || 'Unknown Test'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Category:</span>
                      <span>{test?.category || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">
                        Reference Range:
                      </span>
                      <span className="font-mono">
                        {test?.reference_range || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Price:</span>
                      <span className="font-mono font-bold">
                        {test?.price
                          ? `${test.price.toLocaleString()} TZS`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Order ID:</span>
                      <span className="font-mono">
                        {selectedSampleForDrawer.lab_order_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Order Status:</span>
                      <span className="font-mono uppercase">
                        {order?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <User size={12} /> Patient Details
                  </h3>
                  <div className="p-3 rounded-card bg-panel/40 border border-border/40 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Patient Name:</span>
                      <span className="font-bold">
                        {customer?.full_name || 'Guest Patient'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Phone Number:</span>
                      <span className="font-mono">{customer?.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Email:</span>
                      <span>{customer?.email || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">
                        Outstanding Balance:
                      </span>
                      <span className="font-mono font-bold">
                        {customer?.outstanding_balance
                          ? `${customer.outstanding_balance.toLocaleString()} TZS`
                          : '0 TZS'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Viability Schema Note */}
                <div className="p-2.5 rounded-card bg-panel-strong/30 border border-border/30 text-[10px] text-text-muted leading-relaxed">
                  <p className="font-semibold text-text">
                    Schema Note (Flag to Sairiamu):
                  </p>
                  Sample viability expiration (Exp) is derived from test
                  catalog SLA default. If per-sample viability tracking is
                  needed in future, add `expiry_at` column to `lab_sample`.
                </div>
              </div>
            );
          })()}
      </Drawer>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
