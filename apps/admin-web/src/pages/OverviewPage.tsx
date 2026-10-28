import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ShieldCheck, Clock, RefreshCcw, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { KPITile } from '../_copied/components/KPITile';
import { apiFetch } from '../lib/api';

interface OverviewData {
  kpis: {
    registered_businesses: number;
    verified_percentage: number;
    pending_count: number;
    active_businesses: number;
    platform_sales_today: number;
    open_infra_alerts: number;
  };
  signups_per_day: Array<{ date: string; count: number }>;
  platform_daily_sales: Array<{ date: string; revenue: number }>;
  needs_attention: Array<{
    type: string;
    id: string;
    name: string;
    description: string;
    time: string;
    link: string;
  }>;
}

export function OverviewPage() {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery<OverviewData>({
    queryKey: ['admin-overview'],
    queryFn: () => apiFetch<OverviewData>('/admin/v1/overview'),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-surface-hover rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-surface-hover rounded-xl" />
          <div className="h-72 bg-surface-hover rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-rose-500" />
        <p className="text-rose-500 font-medium">Failed to load overview data.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {
    registered_businesses: 0,
    verified_percentage: 0,
    pending_count: 0,
    active_businesses: 0,
    platform_sales_today: 0,
    open_infra_alerts: 0,
  };

  const signups = data?.signups_per_day || [];
  const sales = data?.platform_daily_sales || [];
  const needsAttention = data?.needs_attention || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Overview</h1>
        <p className="text-sm text-text-muted mt-1">Platform metrics, telemetry, and operational alerts.</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div onClick={() => navigate('/businesses')} className="cursor-pointer">
          <KPITile
            title="Registered Businesses"
            value={kpis.registered_businesses}
            tone="primary"
            icon={<Building2 size={18} />}
            subtext="Total active workspaces"
          />
        </div>

        <div onClick={() => navigate('/businesses?status=verified')} className="cursor-pointer">
          <KPITile
            title="Verified %"
            value={kpis.verified_percentage}
            formatting={{ suffix: '%', decimals: 1 }}
            tone="accent"
            icon={<ShieldCheck size={18} />}
            subtext="TMDA & Pharmacy Council verified"
          />
        </div>

        <div onClick={() => navigate('/businesses?status=pending')} className="cursor-pointer">
          <KPITile
            title="Pending Verification"
            value={kpis.pending_count}
            tone={kpis.pending_count > 0 ? 'danger' : 'default'}
            icon={<Clock size={18} />}
            subtext="Awaiting admin review"
          />
        </div>

        <div onClick={() => navigate('/sync')} className="cursor-pointer">
          <KPITile
            title="Active Businesses"
            value={kpis.active_businesses}
            tone="primary"
            icon={<RefreshCcw size={18} />}
            subtext="Synced in last 24 hours"
          />
        </div>

        <div onClick={() => navigate('/analytics')} className="cursor-pointer">
          <KPITile
            title="Platform Sales Today"
            value={kpis.platform_sales_today}
            formatting={{ prefix: 'TZS ' }}
            tone="accent"
            icon={<TrendingUp size={18} />}
            subtext="Aggregated daily total"
          />
        </div>

        <div onClick={() => navigate('/infra')} className="cursor-pointer">
          <KPITile
            title="Open Infra Alerts"
            value={kpis.open_infra_alerts}
            tone={kpis.open_infra_alerts > 0 ? 'danger' : 'default'}
            icon={<AlertTriangle size={18} />}
            subtext="Unresolved system health checks"
          />
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
          <h3 className="font-heading font-semibold text-text-primary text-sm">30-Day Signups</h3>
          <div className="h-64 w-full">
            {signups.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">No signup data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" opacity={0.3} />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface-primary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--color-action-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
          <h3 className="font-heading font-semibold text-text-primary text-sm">Platform Daily Sales (TZS)</h3>
          <div className="h-64 w-full">
            {sales.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">No sales data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" opacity={0.3} />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface-primary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                  />
                  <Bar dataKey="revenue" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Needs Attention List */}
      <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
        <h3 className="font-heading font-semibold text-text-primary text-sm">Needs Attention</h3>
        {needsAttention.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">All clear! No items require immediate attention.</div>
        ) : (
          <div className="divide-y divide-border">
            {needsAttention.map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigate(item.link)}
                className="py-3 flex items-center justify-between hover:bg-surface-hover px-3 rounded-lg transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">{item.name}</span>
                    <span className="font-mono text-xs text-text-muted">({item.id})</span>
                  </div>
                  <p className="text-xs text-text-muted">{item.description}</p>
                </div>
                <span className="text-xs text-action-primary font-medium hover:underline">Review &rarr;</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
