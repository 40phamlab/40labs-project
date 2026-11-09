import * as React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { DataTable, type ColumnDefinition, EmptyState } from '@40labs/ui-components';
import { Search, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { ComputedStockAnalytics, MovementRecord } from '../../analytics/stockAnalytics.queries';
import { ScrollableChartCard } from '../../analytics/ScrollableChartCard';

export interface MovementTabProps {
  analytics?: ComputedStockAnalytics;
  isLoading?: boolean;
  onSelectItem?: (itemId: string) => void;
}

export const MovementTab: React.FC<MovementTabProps> = ({ analytics, isLoading, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [movementTypeFilter, setMovementTypeFilter] = React.useState<string>('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  if (isLoading || !analytics) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
          <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
          <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
        </div>
        <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[300px]" />
      </div>
    );
  }

  const { movement, top_moving, movement_records = [] } = analytics;
  const hasMovement = movement.length > 0;
  const hasTopMoving = top_moving.length > 0;

  const filteredRecords = React.useMemo(() => {
    return movement_records.filter((rec) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        rec.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.reference_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = movementTypeFilter === 'ALL' || rec.movement_type === movementTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [movement_records, searchTerm, movementTypeFilter]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const columns: ColumnDefinition<MovementRecord>[] = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      width: '150px',
      render: (item) => <span className="font-mono text-xs">{new Date(item.timestamp).toLocaleString()}</span>,
    },
    {
      key: 'product_name',
      header: 'Product Name',
      width: '180px',
      render: (item) => <span className="font-medium text-text">{item.product_name}</span>,
    },
    {
      key: 'sku',
      header: 'SKU / Batch',
      width: '120px',
      render: (item) => <span className="font-mono text-xs text-text-muted">{item.sku}</span>,
    },
    {
      key: 'movement_type',
      header: 'Movement Type',
      width: '140px',
      render: (item) => {
        const isAdd = item.quantity_added > 0;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
              isAdd ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}
          >
            {isAdd ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
            {item.movement_type}
          </span>
        );
      },
    },
    {
      key: 'quantity_added',
      header: 'Qty Added',
      width: '90px',
      render: (item) => <span className="font-mono text-xs text-success font-semibold">{item.quantity_added > 0 ? `+${item.quantity_added}` : '-'}</span>,
    },
    {
      key: 'quantity_removed',
      header: 'Qty Removed',
      width: '90px',
      render: (item) => <span className="font-mono text-xs text-danger font-semibold">{item.quantity_removed > 0 ? `-${item.quantity_removed}` : '-'}</span>,
    },
    {
      key: 'previous_balance',
      header: 'Prev Bal',
      width: '80px',
      render: (item) => <span className="font-mono text-xs">{item.previous_balance}</span>,
    },
    {
      key: 'new_balance',
      header: 'New Bal',
      width: '80px',
      render: (item) => <span className="font-mono text-xs font-bold">{item.new_balance}</span>,
    },
    {
      key: 'reference_id',
      header: 'Reference ID',
      width: '130px',
      render: (item) => <span className="font-mono text-[11px] text-text-muted">{item.reference_id}</span>,
    },
    {
      key: 'user_responsible',
      header: 'User',
      width: '120px',
      render: (item) => <span className="text-xs">{item.user_responsible}</span>,
    },
    {
      key: 'branch',
      header: 'Branch',
      width: '110px',
      render: (item) => <span className="text-xs text-text-muted">{item.branch}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
        {/* 1. Stock In vs Out Line Chart */}
        <ScrollableChartCard
          title="Bidhaa Zinazoingia na Kutoka"
          isEmpty={!hasMovement}
          rowCount={movement.length}
          rowHeight={28}
          ariaLabel="Stock In vs Out Chart"
          fallbackTableData={movement.map((m) => ({ label: m.date, count: m.units_in, value: m.units_out }))}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movement} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
              <Line type="monotone" dataKey="units_in" name="In (Ingia)" stroke="#16A34A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="units_out" name="Out (Toka)" stroke="#F97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ScrollableChartCard>

        {/* 2. Most Used Bar Chart (Horizontal) */}
        <ScrollableChartCard
          title="Bidhaa Zinazotumika Zaidi"
          isEmpty={!hasTopMoving}
          rowCount={top_moving.length}
          rowHeight={28}
          ariaLabel="Most Used Stock Chart"
          fallbackTableData={top_moving.map((t) => ({ label: t.name, count: t.units_out, value: t.units_out }))}
        >
          {(showAll) => {
            const displayedTopMoving = showAll ? top_moving : top_moving.slice(0, 8);
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedTopMoving}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} units`, 'Units Out']}
                    contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                  />
                  <Bar
                    dataKey="units_out"
                    fill="#16A34A"
                    radius={[0, 4, 4, 0]}
                    onClick={(barData) => {
                      const idx = (barData as any).index;
                      if (idx !== undefined && displayedTopMoving[idx] && onSelectItem) {
                        onSelectItem(displayedTopMoving[idx].item_id);
                      }
                    }}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            );
          }}
        </ScrollableChartCard>
      </div>

      {/* Movement History Table Section */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-text">Historia ya Miondoko ya Stock (Movement History)</h3>
            <span className="text-xs bg-surface-secondary px-2 py-0.5 rounded-full font-mono text-text-muted">
              {filteredRecords.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Tafuta bidhaa, SKU, au Ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-secondary text-text text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border/40 focus:outline-none focus:border-primary w-56"
              />
            </div>

            {/* Movement Type Filter */}
            <div className="flex items-center gap-1.5 bg-surface-secondary px-2 py-1.5 rounded-lg border border-border/40 text-xs">
              <Filter size={14} className="text-text-muted" />
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="bg-transparent text-text focus:outline-none cursor-pointer"
              >
                <option value="ALL">Aina Zote (All Types)</option>
                <option value="Stock Addition">Stock Addition</option>
                <option value="Sales Deduction">Sales Deduction</option>
                <option value="Purchase Received">Purchase Received</option>
                <option value="Stock Adjustment">Stock Adjustment</option>
                <option value="Return">Return</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            title="Hakuna Miondoko Iliyopatikana"
            description="Jaribu kubadilisha vigezo vya utafutaji au chujio."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <DataTable data={paginatedRecords} columns={columns} />
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2 border-t border-border/20 text-xs text-text-muted">
              <span>
                Ukurasa {currentPage} kati ya {totalPages} ({filteredRecords.length} jumla)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-surface-secondary hover:bg-surface-secondary/80 disabled:opacity-40 text-text"
                >
                  Nyuma
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded bg-surface-secondary hover:bg-surface-secondary/80 disabled:opacity-40 text-text"
                >
                  Mbele
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
