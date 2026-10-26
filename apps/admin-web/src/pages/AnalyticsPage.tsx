import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Package, Users, Table as TableIcon, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiFetch } from '../lib/api';

interface RevenueResponse {
  range: string;
  group: string;
  revenue_data: Array<{
    bucket: string;
    revenue: number;
    region: string;
    tier: string;
  }>;
  tier_distribution: Record<string, number>;
}

interface ProductsResponse {
  metric: string;
  limit: number;
  products: Array<{
    medicine_id: string;
    units?: number;
    revenue?: number;
    stockouts?: number;
  }>;
}

interface GrowthResponse {
  signups_per_week: Array<{
    week: string;
    signups: number;
  }>;
  activation_rate_pct: number;
  total_registered: number;
  activated_businesses: number;
  verified_count: number;
  unverified_count: number;
}

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('tab') || 'revenue';
  const range = searchParams.get('range') || '30d';
  const group = searchParams.get('group') || 'day';
  const metric = searchParams.get('metric') || 'units';

  // Toggle view state for charts vs tables
  const [revenueView, setRevenueView] = React.useState<'chart' | 'table'>('chart');
  const [tierView, setTierView] = React.useState<'chart' | 'table'>('chart');
  const [productView, setProductView] = React.useState<'chart' | 'table'>('chart');
  const [growthView, setGrowthView] = React.useState<'chart' | 'table'>('chart');

  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useQuery<RevenueResponse>({
    queryKey: ['analytics-revenue', range, group],
    queryFn: () => apiFetch<RevenueResponse>(`/admin/v1/analytics/revenue?range=${range}&group=${group}`),
    enabled: tab === 'revenue',
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery<ProductsResponse>({
    queryKey: ['analytics-products', metric],
    queryFn: () => apiFetch<ProductsResponse>(`/admin/v1/analytics/products?metric=${metric}&limit=20`),
    enabled: tab === 'products',
  });

  const {
    data: growthData,
    isLoading: growthLoading,
    error: growthError,
    refetch: refetchGrowth,
  } = useQuery<GrowthResponse>({
    queryKey: ['analytics-growth', range],
    queryFn: () => apiFetch<GrowthResponse>(`/admin/v1/analytics/growth?range=${range}`),
    enabled: tab === 'growth',
  });

  const updateParam = (key: string, val: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, val);
    setSearchParams(newParams);
  };

  const formatMoney = (amount: number) => {
    return `TZS ${amount.toLocaleString('en-US')}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Analytics & Reports</h1>
          <p className="text-sm text-text-muted mt-1">Platform aggregated revenue, product velocities, and adoption growth.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => updateParam('tab', 'revenue')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'revenue'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <TrendingUp size={16} /> Revenue
        </button>
        <button
          type="button"
          onClick={() => updateParam('tab', 'products')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'products'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Package size={16} /> Products
        </button>
        <button
          type="button"
          onClick={() => updateParam('tab', 'growth')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'growth'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Users size={16} /> Growth
        </button>
      </div>

      {/* REVENUE TAB */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">Range:</span>
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => updateParam('range', r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    range === r ? 'bg-action-primary text-white' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">Group by:</span>
              {(['day', 'week', 'region'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => updateParam('group', g)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    group === g ? 'bg-action-primary text-white' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {revenueLoading ? (
            <div className="p-12 space-y-4 animate-pulse">
              <div className="h-72 bg-surface-hover rounded-xl" />
              <div className="h-64 bg-surface-hover rounded-xl" />
            </div>
          ) : revenueError ? (
            <div className="p-12 text-center text-rose-500 font-medium">
              Failed to load revenue analytics. <button onClick={() => refetchRevenue()} className="underline ml-2">Retry</button>
            </div>
          ) : !revenueData || revenueData.revenue_data.length === 0 ? (
            <div className="p-12 bg-surface rounded-xl border border-border text-center text-text-muted">
              No revenue data yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Timeline Card */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-text-primary text-sm">Platform Revenue Timeline</h3>
                  <button
                    type="button"
                    onClick={() => setRevenueView(revenueView === 'chart' ? 'table' : 'chart')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-hover border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  >
                    {revenueView === 'chart' ? <TableIcon size={14} /> : <BarChart2 size={14} />}
                    {revenueView === 'chart' ? 'View Table' : 'View Chart'}
                  </button>
                </div>

                {revenueView === 'chart' ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData.revenue_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                        <XAxis dataKey="bucket" stroke="var(--color-text-muted)" fontSize={11} />
                        <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                          formatter={(val: any) => [formatMoney(Number(val) || 0), 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="var(--color-action-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-hover sticky top-0 border-b border-border uppercase font-heading text-text-muted">
                        <tr>
                          <th className="px-4 py-2">Bucket</th>
                          <th className="px-4 py-2">Region</th>
                          <th className="px-4 py-2">Tier</th>
                          <th className="px-4 py-2 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {revenueData.revenue_data.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-hover/50">
                            <td className="px-4 py-2 font-mono">{item.bucket}</td>
                            <td className="px-4 py-2">{item.region}</td>
                            <td className="px-4 py-2 font-mono uppercase">{item.tier}</td>
                            <td className="px-4 py-2 font-mono font-semibold text-right">{formatMoney(item.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tier Distribution Card */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-text-primary text-sm">Tier Distribution</h3>
                  <button
                    type="button"
                    onClick={() => setTierView(tierView === 'chart' ? 'table' : 'chart')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-hover border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  >
                    {tierView === 'chart' ? <TableIcon size={14} /> : <BarChart2 size={14} />}
                    {tierView === 'chart' ? 'View Table' : 'View Chart'}
                  </button>
                </div>

                {tierView === 'chart' ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(revenueData.tier_distribution).map(([tier, count]) => ({ tier: tier.toUpperCase(), count }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                        <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} />
                        <YAxis dataKey="tier" type="category" stroke="var(--color-text-muted)" fontSize={11} width={80} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-hover sticky top-0 border-b border-border uppercase font-heading text-text-muted">
                        <tr>
                          <th className="px-4 py-2">Tier</th>
                          <th className="px-4 py-2 text-right">Businesses Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {Object.entries(revenueData.tier_distribution).map(([tier, count], idx) => (
                          <tr key={idx} className="hover:bg-surface-hover/50">
                            <td className="px-4 py-2 font-mono uppercase font-semibold">{tier}</td>
                            <td className="px-4 py-2 font-mono font-semibold text-right">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">Metric:</span>
              {(['units', 'revenue', 'stockouts'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateParam('metric', m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    metric === m ? 'bg-action-primary text-white' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {productsLoading ? (
            <div className="p-12 h-96 bg-surface-hover rounded-xl animate-pulse" />
          ) : productsError ? (
            <div className="p-12 text-center text-rose-500 font-medium">
              Failed to load product analytics. <button onClick={() => refetchProducts()} className="underline ml-2">Retry</button>
            </div>
          ) : !productsData?.products || productsData.products.length === 0 ? (
            <div className="p-12 bg-surface rounded-xl border border-border text-center text-text-muted">
              No product analytics data yet.
            </div>
          ) : (
            <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-text-primary text-sm">
                  Top 20 Medicines by {metric.toUpperCase()}
                </h3>
                <button
                  type="button"
                  onClick={() => setProductView(productView === 'chart' ? 'table' : 'chart')}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-hover border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface transition-colors cursor-pointer"
                >
                  {productView === 'chart' ? <TableIcon size={14} /> : <BarChart2 size={14} />}
                  {productView === 'chart' ? 'View Table' : 'View Chart'}
                </button>
              </div>

              {productView === 'chart' ? (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productsData.products}
                      layout="vertical"
                      margin={{ left: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                      <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} />
                      <YAxis dataKey="medicine_id" type="category" stroke="var(--color-text-muted)" fontSize={11} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                        formatter={(val: any) => [metric === 'revenue' ? formatMoney(Number(val) || 0) : val, metric.toUpperCase()]}
                      />
                      <Bar dataKey={metric === 'revenue' ? 'revenue' : metric === 'stockouts' ? 'stockouts' : 'units'} fill="#F59E0B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-96 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-hover sticky top-0 border-b border-border uppercase font-heading text-text-muted">
                      <tr>
                        <th className="px-4 py-2">Medicine ID</th>
                        <th className="px-4 py-2 text-right">Units Sold</th>
                        <th className="px-4 py-2 text-right">Revenue</th>
                        <th className="px-4 py-2 text-right">Stockouts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {productsData.products.map((p, idx) => (
                        <tr key={idx} className="hover:bg-surface-hover/50">
                          <td className="px-4 py-2 font-mono font-medium">{p.medicine_id}</td>
                          <td className="px-4 py-2 font-mono text-right">{p.units ?? '-'}</td>
                          <td className="px-4 py-2 font-mono text-right">{p.revenue !== undefined ? formatMoney(p.revenue) : '-'}</td>
                          <td className="px-4 py-2 font-mono text-right text-amber-500 font-semibold">{p.stockouts ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* GROWTH TAB */}
      {tab === 'growth' && (
        <div className="space-y-6">
          {growthLoading ? (
            <div className="p-12 space-y-4 animate-pulse">
              <div className="h-40 bg-surface-hover rounded-xl" />
              <div className="h-72 bg-surface-hover rounded-xl" />
            </div>
          ) : growthError ? (
            <div className="p-12 text-center text-rose-500 font-medium">
              Failed to load growth analytics. <button onClick={() => refetchGrowth()} className="underline ml-2">Retry</button>
            </div>
          ) : !growthData ? (
            <div className="p-12 bg-surface rounded-xl border border-border text-center text-text-muted">
              No growth data yet.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface p-5 rounded-xl border border-border space-y-1">
                  <div className="text-xs text-text-muted font-heading uppercase">Activation Rate</div>
                  <div className="text-2xl font-mono font-bold text-emerald-500">
                    {growthData.activation_rate_pct.toFixed(1)}%
                  </div>
                  <div className="text-xs text-text-secondary">
                    {growthData.activated_businesses} of {growthData.total_registered} registered businesses activated
                  </div>
                </div>

                <div className="bg-surface p-5 rounded-xl border border-border space-y-1">
                  <div className="text-xs text-text-muted font-heading uppercase">Verified Businesses</div>
                  <div className="text-2xl font-mono font-bold text-text-primary">
                    {growthData.verified_count}
                  </div>
                  <div className="text-xs text-text-secondary">Successfully verified compliance</div>
                </div>

                <div className="bg-surface p-5 rounded-xl border border-border space-y-1">
                  <div className="text-xs text-text-muted font-heading uppercase">Unverified Businesses</div>
                  <div className="text-2xl font-mono font-bold text-amber-500">
                    {growthData.unverified_count}
                  </div>
                  <div className="text-xs text-text-secondary">Pending or unverified</div>
                </div>
              </div>

              {/* Signups per week chart */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-text-primary text-sm">Weekly Signups Growth</h3>
                  <button
                    type="button"
                    onClick={() => setGrowthView(growthView === 'chart' ? 'table' : 'chart')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-hover border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  >
                    {growthView === 'chart' ? <TableIcon size={14} /> : <BarChart2 size={14} />}
                    {growthView === 'chart' ? 'View Table' : 'View Chart'}
                  </button>
                </div>

                {growthView === 'chart' ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData.signups_per_week}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                        <XAxis dataKey="week" stroke="var(--color-text-muted)" fontSize={11} />
                        <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="signups" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-hover sticky top-0 border-b border-border uppercase font-heading text-text-muted">
                        <tr>
                          <th className="px-4 py-2">Week</th>
                          <th className="px-4 py-2 text-right">Signups</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {growthData.signups_per_week.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-hover/50">
                            <td className="px-4 py-2 font-mono">{item.week}</td>
                            <td className="px-4 py-2 font-mono font-semibold text-right">{item.signups}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
