import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ShieldCheck, Clock, RefreshCcw, AlertCircle, XCircle, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { KPITile } from '../_copied/components/KPITile';
import { TabContainer } from '../_copied/components/TabContainer';
import { apiFetch } from '../lib/api';
import type { AdminOverviewResponse } from '@40labs/types';

interface AttentionItem {
  id: string;
  name: string;
  description: string;
  link: string;
}

interface ActivityItem {
  action: string;
  business_id: string;
  name: string;
  timestamp: string;
  payload?: Record<string, unknown> | null;
}

interface RegionItem {
  region: string;
  count: number;
}

interface TierItem {
  tier: string;
  count: number;
}

interface RegistrationItem {
  date: string;
  count: number;
}

interface OverviewData extends AdminOverviewResponse {
  total?: number;
  pending?: number;
  verified?: number;
  rejected?: number;
  new_7d?: number;
  active_24h?: number;
  active_7d?: number;
  attention?: Array<Record<string, unknown>>;
  recent_activity?: ActivityItem[];
  by_region?: RegionItem[];
  by_tier?: TierItem[];
  registrations_30d?: RegistrationItem[];
}

const COLORS = ['var(--color-action-primary)', 'var(--color-accent)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
      <TabContainer>
        <div className="space-y-6 animate-pulse">
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
      </TabContainer>
    );
  }

  if (error) {
    return (
      <TabContainer>
        <div className="p-12 max-w-xl mx-auto text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-rose-500" />
          <p className="text-rose-500 font-medium">Failed to load overview data: {error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </TabContainer>
    );
  }

  if (!data) {
    return (
      <TabContainer>
        <div className="p-12 max-w-xl mx-auto text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-amber-500" />
          <p className="text-text-primary font-medium">No overview data available.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </TabContainer>
    );
  }

  const kpis = data.kpis;
  const total = data.total ?? kpis.registered_businesses;
  const pending = data.pending ?? kpis.pending_count;
  const verified = data.verified ?? Math.round((total * kpis.verified_percentage) / 100);
  const rejected = data.rejected ?? 0;
  const active24h = data.active_24h ?? kpis.active_businesses;
  const new7d = data.new_7d ?? 0;

  const rawAttention = data.attention ?? data.needs_attention ?? [];
  const attentionItems: AttentionItem[] = rawAttention.map((item: Record<string, unknown>) => ({
    id: String(item.id || ''),
    name: String(item.name || ''),
    description: String(item.description || item.reason || 'Needs attention'),
    link: String(item.link || `/businesses/${item.id || ''}`),
  }));

  const recentActivity = data.recent_activity ?? [];
  const byRegion = data.by_region ?? [];
  const byTier = data.by_tier ?? [];
  const registrations30d = data.registrations_30d ?? data.signups_per_day ?? [];

  return (
    <TabContainer>
      <div className="space-y-6">
        {/* Row 1, KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div onClick={() => navigate('/businesses')} className="cursor-pointer">
            <KPITile
              title="Total businesses"
              value={total}
              tone="primary"
              icon={<Building2 size={18} />}
            />
          </div>

          <div onClick={() => navigate('/businesses?status=pending')} className="cursor-pointer">
            <KPITile
              title="Pending verification"
              value={pending}
              tone={pending > 0 ? 'danger' : 'default'}
              icon={<Clock size={18} />}
            />
          </div>

          <div onClick={() => navigate('/businesses?status=verified')} className="cursor-pointer">
            <KPITile
              title="Verified"
              value={verified}
              tone="accent"
              icon={<ShieldCheck size={18} />}
            />
          </div>

          <div onClick={() => navigate('/businesses?status=rejected')} className="cursor-pointer">
            <KPITile
              title="Rejected"
              value={rejected}
              tone={rejected > 0 ? 'danger' : 'default'}
              icon={<XCircle size={18} />}
            />
          </div>

          <div onClick={() => navigate('/sync')} className="cursor-pointer">
            <KPITile
              title="Active (24h)"
              value={active24h}
              tone="primary"
              icon={<RefreshCcw size={18} />}
            />
          </div>

          <div onClick={() => navigate('/businesses')} className="cursor-pointer">
            <KPITile
              title="New this week"
              value={new7d}
              tone="accent"
              icon={<Activity size={18} />}
            />
          </div>
        </div>

        {/* Row 2 (two panels) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Needs attention queue */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
            <h3 className="font-heading font-semibold text-text-primary text-sm">Needs attention</h3>
            {attentionItems.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">All clear! No items require attention.</div>
            ) : (
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {attentionItems.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between hover:bg-surface-hover px-2 rounded transition-colors">
                    <div>
                      <Link to={item.link} className="font-medium text-text-primary text-sm hover:text-action-primary">
                        {item.name}
                      </Link>
                      <p className="text-xs text-text-muted">{item.description}</p>
                    </div>
                    <Link to={item.link} className="text-xs text-action-primary font-medium hover:underline">
                      View &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Recent activity */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
            <h3 className="font-heading font-semibold text-text-primary text-sm">Recent activity</h3>
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">No recent activity recorded.</div>
            ) : (
              <div className="divide-y divide-border max-h-72 overflow-y-auto text-sm">
                {recentActivity.map((act, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between px-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary uppercase text-xs px-1.5 py-0.5 rounded bg-action-primary/10 text-action-primary">
                          {act.action}
                        </span>
                        <Link to={`/businesses/${act.business_id}`} className="text-text-primary font-medium hover:underline">
                          {act.name}
                        </Link>
                      </div>
                      <p className="text-[11px] text-text-muted font-mono">{act.business_id}</p>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Businesses by region (bar) */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
            <h3 className="font-heading font-semibold text-text-primary text-sm">Businesses by region</h3>
            <div className="h-60 w-full">
              {byRegion.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">No region data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRegion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" opacity={0.3} />
                    <XAxis dataKey="region" stroke="var(--color-text-muted)" fontSize={10} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={10} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface-primary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }} />
                    <Bar dataKey="count" fill="var(--color-action-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tier distribution (donut) */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
            <h3 className="font-heading font-semibold text-text-primary text-sm">Tier distribution</h3>
            <div className="h-60 w-full">
              {byTier.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">No tier data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ background: 'var(--color-surface-primary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }} />
                    <Pie data={byTier} dataKey="count" nameKey="tier" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {byTier.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Registrations over 30 days (line) */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
            <h3 className="font-heading font-semibold text-text-primary text-sm">Registrations (30d)</h3>
            <div className="h-60 w-full">
              {registrations30d.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">No registration data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={registrations30d}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" opacity={0.3} />
                    <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={10} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface-primary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }} />
                    <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
}
