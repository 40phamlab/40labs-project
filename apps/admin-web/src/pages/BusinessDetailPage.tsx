import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, PackageSearch, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Business {
  business_id: string;
  name: string;
  region: string | null;
  tmda_number: string | null;
  tier: string;
  verification_status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface StockItem {
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  low_stock_threshold: number;
}

type Decision = 'verified' | 'rejected' | 'suspended';

export function BusinessDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState<'profile' | 'stock' | 'sync' | 'activity'>('profile');
  const [reason, setReason] = React.useState('');
  const [decisionError, setDecisionError] = React.useState('');
  const [decisionMessage, setDecisionMessage] = React.useState('');

  const { data: business, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-business', id],
    queryFn: () => apiFetch<Business>(`/admin/v1/businesses/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });
  const { data: stock } = useQuery<{
    items: StockItem[];
    total: number;
    summary: { item_count: number; low_stock_count: number; expiring_soon_count: number };
  }>({
    queryKey: ['admin-business-stock', id],
    queryFn: () => apiFetch(`/admin/v1/businesses/${encodeURIComponent(id)}/stock`),
    enabled: Boolean(id) && tab === 'stock',
  });
  const { data: sync } = useQuery<{
    devices: Array<{ device_id: string; last_seen_at: string | null; outbox_pending: number; app_version: string | null }>;
    changes: Array<{ change_id: string; entity: string; entity_id: string; version: number; received_at: string }>;
  }>({
    queryKey: ['admin-business-sync', id],
    queryFn: () => apiFetch(`/admin/v1/businesses/${encodeURIComponent(id)}/sync`),
    enabled: Boolean(id) && tab === 'sync',
  });
  const { data: activity } = useQuery<{ activity: Array<{ action: string; admin: string; payload: Record<string, unknown> | null; created_at: string }> }>({
    queryKey: ['admin-business-activity', id],
    queryFn: () => apiFetch(`/admin/v1/businesses/${encodeURIComponent(id)}/activity`),
    enabled: Boolean(id) && tab === 'activity',
  });
  const decisionMutation = useMutation({
    mutationFn: ({ decision, reason: decisionReason }: { decision: Decision; reason?: string }) =>
      apiFetch<{ success: boolean; status: string }>(`/admin/v1/businesses/${encodeURIComponent(id)}/verification`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason: decisionReason }),
      }),
    onSuccess: async (result) => {
      setDecisionError('');
      setDecisionMessage(`Business ${result.status}.`);
      setReason('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-business', id] }),
        queryClient.invalidateQueries({ queryKey: ['admin-businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-overview'] }),
      ]);
    },
    onError: (err: Error) => {
      setDecisionMessage('');
      setDecisionError(err.message);
    },
  });

  const decide = (decision: Decision) => {
    const decisionReason = reason.trim();
    if (decision !== 'verified' && !decisionReason) {
      setDecisionError('Enter a reason before rejecting or suspending this business.');
      return;
    }
    if (!window.confirm(`Confirm ${decision} for ${business?.name || id}?`)) return;
    setDecisionError('');
    setDecisionMessage('');
    decisionMutation.mutate({ decision, reason: decisionReason || undefined });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <Building2 size={15} /> },
    { id: 'stock', label: 'Stock & Prices', icon: <PackageSearch size={15} /> },
    { id: 'sync', label: 'Sync', icon: <RefreshCw size={15} /> },
    { id: 'activity', label: 'Activity', icon: <ShieldCheck size={15} /> },
  ] as const;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <button type="button" onClick={() => navigate('/businesses')} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft size={16} /> Back to Businesses
      </button>

      {isLoading ? (
        <div className="space-y-4 animate-pulse" aria-label="Loading business">
          <div className="h-10 w-1/3 rounded-lg bg-surface-hover" />
          <div className="h-64 rounded-xl bg-surface-hover" />
        </div>
      ) : error ? (
        <section className="space-y-3 rounded-xl border border-danger-border bg-danger-bg p-6" role="alert">
          <p className="text-danger">{(error as Error).message}</p>
          <button type="button" onClick={() => refetch()} className="rounded-lg bg-action-primary px-4 py-2 text-sm font-semibold text-white">Retry</button>
        </section>
      ) : business ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-primary p-6">
            <div>
              <h1 className="text-title-page text-text-primary">{business.name}</h1>
              <p className="mt-1 font-mono text-xs text-text-muted">{business.business_id}</p>
              <p className="mt-3 text-sm text-text-secondary">{business.region || 'Region not provided'} · TMDA {business.tmda_number || 'not provided'}</p>
            </div>
            <span className="rounded-full border border-info-border bg-info-bg px-3 py-1 text-xs font-semibold capitalize text-info">{business.verification_status}</span>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Business details">
            {tabs.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'page' : undefined}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm ${tab === item.id ? 'border-action-primary text-action-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>

          {tab === 'profile' && (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              <section className="space-y-4 rounded-xl border border-border bg-surface-primary p-5">
                <h2 className="text-title-section text-text-primary">Registration profile</h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                  <div><dt className="text-text-muted">Business ID</dt><dd className="mt-1 break-all font-mono text-text-primary">{business.business_id}</dd></div>
                  <div><dt className="text-text-muted">Tier</dt><dd className="mt-1 capitalize text-text-primary">{business.tier.replace(/_/g, ' ')}</dd></div>
                  <div><dt className="text-text-muted">Region</dt><dd className="mt-1 text-text-primary">{business.region || 'Not provided'}</dd></div>
                  <div><dt className="text-text-muted">TMDA number</dt><dd className="mt-1 font-mono text-text-primary">{business.tmda_number || 'Not provided'}</dd></div>
                  <div className="col-span-2"><dt className="text-text-muted">Registered</dt><dd className="mt-1 text-text-primary">{new Date(business.created_at).toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' })}</dd></div>
                  {business.rejection_reason && <div className="col-span-2"><dt className="text-text-muted">Decision reason</dt><dd className="mt-1 text-text-primary">{business.rejection_reason}</dd></div>}
                </dl>
              </section>

              <section className="space-y-4 rounded-xl border border-border bg-surface-primary p-5">
                <div><h2 className="text-title-section text-text-primary">Verification decision</h2><p className="mt-1 text-sm text-text-muted">Decisions are recorded in the admin audit log.</p></div>
                <label className="block text-sm text-text-secondary" htmlFor="decision-reason">Reason for rejection or suspension</label>
                <textarea id="decision-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000}
                  className="w-full rounded-lg border border-border bg-surface-disabled p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                  placeholder="Required when rejecting or suspending" />
                {decisionError && <p className="text-sm text-danger" role="alert">{decisionError}</p>}
                {decisionMessage && <p className="text-sm text-success" role="status">{decisionMessage}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={decisionMutation.isPending} onClick={() => decide('verified')} className="rounded-lg bg-success px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify</button>
                  <button type="button" disabled={decisionMutation.isPending} onClick={() => decide('rejected')} className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm font-semibold text-danger disabled:opacity-50">Reject</button>
                  <button type="button" disabled={decisionMutation.isPending} onClick={() => decide('suspended')} className="rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-sm font-semibold text-warning disabled:opacity-50">Suspend</button>
                </div>
              </section>
            </div>
          )}

          {tab === 'stock' && (
            <section className="space-y-4">
              {stock ? <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface-primary p-4"><p className="text-xs text-text-muted">Stock records</p><p className="mt-1 text-stat-number text-text-primary">{stock.summary.item_count}</p></div>
                <div className="rounded-xl border border-border bg-surface-primary p-4"><p className="text-xs text-text-muted">At or below low stock</p><p className="mt-1 text-stat-number text-warning">{stock.summary.low_stock_count}</p></div>
                <div className="rounded-xl border border-border bg-surface-primary p-4"><p className="text-xs text-text-muted">Expiring in 90 days</p><p className="mt-1 text-stat-number text-danger">{stock.summary.expiring_soon_count}</p></div>
              </div> : <div className="h-32 animate-pulse rounded-xl bg-surface-hover" />}
              <div className="overflow-x-auto rounded-xl border border-border bg-surface-primary">
                {!stock ? <p className="p-6 text-sm text-text-muted">Loading stock records…</p> : stock.items.length === 0 ? <p className="p-8 text-center text-sm text-text-muted">No stock records are available for this business.</p> : (
                  <table className="w-full text-left text-sm"><thead className="border-b border-border bg-surface-hover text-xs text-text-muted"><tr><th className="px-4 py-3">Medicine ID</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Buy price</th><th className="px-4 py-3">Sell price</th><th className="px-4 py-3">Expiry</th></tr></thead>
                    <tbody className="divide-y divide-border">{stock.items.map((item) => <tr key={`${item.medicine_id}:${item.batch_number}`} className="text-text-primary"><td className="px-4 py-3 font-mono text-xs">{item.medicine_id}</td><td className="px-4 py-3 font-mono text-xs">{item.batch_number}</td><td className={`px-4 py-3 ${item.quantity <= item.low_stock_threshold ? 'text-warning' : ''}`}>{item.quantity}</td><td className="px-4 py-3 font-mono">TZS {item.buy_price.toLocaleString('en-TZ')}</td><td className="px-4 py-3 font-mono">TZS {item.sell_price.toLocaleString('en-TZ')}</td><td className="px-4 py-3">{item.expiry_date}</td></tr>)}</tbody>
                  </table>
                )}
              </div>
            </section>
          )}
          {tab === 'sync' && (
            <section className="space-y-5">
              <div className="rounded-xl border border-border bg-surface-primary p-5"><h2 className="text-title-section text-text-primary">Registered devices</h2>{!sync ? <div className="mt-3 h-20 animate-pulse rounded bg-surface-hover" /> : sync.devices.length === 0 ? <p className="mt-3 text-sm text-text-muted">No sync devices are registered for this business.</p> : <div className="mt-3 divide-y divide-border">{sync.devices.map((device) => <div key={device.device_id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-mono text-xs text-text-primary">{device.device_id}</span><span className="text-text-muted">{device.app_version || 'Version unknown'} · {device.outbox_pending} pending · {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' }) : 'Not seen'}</span></div>)}</div>}</div>
              <div className="rounded-xl border border-border bg-surface-primary p-5"><h2 className="text-title-section text-text-primary">Recent changes</h2>{!sync ? <div className="mt-3 h-20 animate-pulse rounded bg-surface-hover" /> : sync.changes.length === 0 ? <p className="mt-3 text-sm text-text-muted">No sync changes have been recorded for this business.</p> : <div className="mt-3 divide-y divide-border">{sync.changes.map((change) => <div key={change.change_id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="text-text-primary">{change.entity} · <span className="font-mono text-xs text-text-muted">{change.entity_id}</span></span><span className="text-xs text-text-muted">v{change.version} · {new Date(change.received_at).toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' })}</span></div>)}</div>}</div>
            </section>
          )}
          {tab === 'activity' && <section className="rounded-xl border border-border bg-surface-primary p-5"><h2 className="text-title-section text-text-primary">Admin activity</h2>{!activity ? <div className="mt-3 h-20 animate-pulse rounded bg-surface-hover" /> : activity.activity.length === 0 ? <p className="mt-3 text-sm text-text-muted">No admin actions have been recorded for this business.</p> : <div className="mt-3 divide-y divide-border">{activity.activity.map((entry, index) => <div key={`${entry.action}:${entry.created_at}:${index}`} className="flex flex-wrap justify-between gap-2 py-3"><div><p className="text-sm font-medium text-text-primary">{entry.action.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-text-muted">By {entry.admin}{entry.payload?.reason ? ` · ${entry.payload.reason}` : ''}</p></div><time className="text-xs text-text-muted">{new Date(entry.created_at).toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' })}</time></div>)}</div>}</section>}
        </>
      ) : <p className="py-12 text-center text-text-muted">Business not found.</p>}
    </main>
  );
}
