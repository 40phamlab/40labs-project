import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Copy, Check, AlertCircle, CreditCard, Activity, FileText } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { AdminBusinessActivityResponse, AdminVerificationDecision } from '@40labs/types';

interface BusinessProfile {
  identity: {
    business_id: string;
    name: string | null;
    logo_url: string | null;
    scale: string;
    role_scopes: string;
    created_at: string;
  };
  ownership: {
    owner_type: string;
    owner_first_name: string;
    owner_last_name: string;
    phone: string;
    phone_verified: boolean;
    email: string | null;
    sudo_user_count: number;
  };
  location: {
    region: string | null;
    district: string | null;
    ward: string | null;
    address_text: string | null;
  };
  compliance: {
    tmda_number: string | null;
    pharmacy_council_no: string | null;
    verification_status: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
  };
  payments_config: {
    branches_count: number;
    lipa_namba: string | null;
    payment_number_masked: string | null;
  };
  operations: {
    branch_count: number;
    branches: Array<{ branch_id: string; name: string | null; region: string | null }>;
    user_count_by_role: Record<string, number>;
    device_count: number;
    product_count: number;
    product_cap: number;
  };
  sync_health: {
    last_sync_at: string | null;
    pending_outbox_count: number;
    app_version: string | null;
    last_error: string | null;
  };
  usage: {
    revenue_30d: number;
    sales_count_30d: number;
    lab_orders_30d: number;
  };
}

export function BusinessDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState<'overview' | 'billing' | 'activity' | 'notes'>('overview');
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState('');

  const { data: business, isLoading, error, refetch } = useQuery<BusinessProfile>({
    queryKey: ['admin-business-profile', id],
    queryFn: () => apiFetch<BusinessProfile>(`/admin/v1/businesses/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });

  const { data: activity } = useQuery<AdminBusinessActivityResponse>({
    queryKey: ['admin-business-activity', id],
    queryFn: () => apiFetch<AdminBusinessActivityResponse>(`/admin/v1/businesses/${encodeURIComponent(id)}/activity`),
    enabled: Boolean(id) && tab === 'activity',
  });

  const decisionMutation = useMutation({
    mutationFn: ({ decision, reason: decisionReason }: { decision: AdminVerificationDecision; reason?: string }) =>
      apiFetch<{ success: boolean; status: string }>(`/admin/v1/businesses/${encodeURIComponent(id)}/verification`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason: decisionReason }),
      }),
    onSuccess: async () => {
      setReason('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-business-profile', id] }),
        queryClient.invalidateQueries({ queryKey: ['admin-businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-overview'] }),
      ]);
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const decide = (decision: AdminVerificationDecision) => {
    const decisionReason = reason.trim();
    if (decision !== 'verified' && !decisionReason) {
      alert('Enter a reason before rejecting or suspending this business.');
      return;
    }
    if (!window.confirm(`Confirm ${decision} for ${business?.identity?.name || id}?`)) return;
    decisionMutation.mutate({ decision, reason: decisionReason || undefined });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Building2 size={15} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={15} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={15} /> },
  ] as const;

  const renderVal = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return <span className="text-text-muted">—</span>;
    return <span className="text-text-primary">{val}</span>;
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <button type="button" onClick={() => navigate('/businesses')} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary cursor-pointer">
        <ArrowLeft size={16} /> Back to Businesses
      </button>

      {isLoading ? (
        <div className="space-y-4 animate-pulse" aria-label="Loading business profile">
          <div className="h-24 rounded-xl bg-surface-hover" />
          <div className="h-96 rounded-xl bg-surface-hover" />
        </div>
      ) : error ? (
        <section className="space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center" role="alert">
          <AlertCircle size={32} className="mx-auto text-rose-500" />
          <p className="text-rose-500 font-medium">Failed to load business profile: {(error as Error).message}</p>
          <button type="button" onClick={() => refetch()} className="rounded-lg bg-action-primary px-4 py-2 text-sm font-semibold text-white cursor-pointer">Retry</button>
        </section>
      ) : !business ? (
        <div className="p-16 text-center space-y-3 rounded-xl border border-border bg-surface">
          <Building2 size={36} className="mx-auto text-text-muted opacity-40" />
          <h2 className="text-lg font-bold text-text-primary">Business not found</h2>
          <p className="text-sm text-text-muted">The requested business profile does not exist or was removed.</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-text-primary font-bold overflow-hidden">
                {business.identity.logo_url ? (
                  <img src={business.identity.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={24} className="text-action-primary" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-heading font-bold text-text-primary">{business.identity.name || 'Unnamed Business'}</h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    business.compliance.verification_status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    business.compliance.verification_status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {business.compliance.verification_status}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-action-primary/10 text-action-primary border border-action-primary/20 uppercase">
                    {business.identity.scale}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <span>ID: {business.identity.business_id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(business.identity.business_id, 'header-id')}
                    className="hover:text-text-primary cursor-pointer"
                    title="Copy Business ID"
                  >
                    {copiedKey === 'header-id' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <span>·</span>
                  <span>Role: {business.identity.role_scopes}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => decide('verified')}
                disabled={decisionMutation.isPending}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
              >
                Verify
              </button>
              <button
                type="button"
                onClick={() => decide('rejected')}
                disabled={decisionMutation.isPending}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </header>

          {/* Tabs */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Business profile sections">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  tab === item.id ? 'border-action-primary text-action-primary font-semibold' : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </nav>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Identity & Scale */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Identity</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Business ID</dt>
                    <dd className="font-mono text-xs flex items-center gap-1.5">
                      {business.identity.business_id}
                      <button type="button" onClick={() => copyToClipboard(business.identity.business_id, 'identity-id')} className="cursor-pointer text-text-muted hover:text-text-primary">
                        {copiedKey === 'identity-id' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Name</dt>
                    <dd>{renderVal(business.identity.name)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Scale</dt>
                    <dd className="capitalize">{renderVal(business.identity.scale)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Role scope</dt>
                    <dd className="capitalize">{renderVal(business.identity.role_scopes)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Registered</dt>
                    <dd className="text-xs">{renderVal(new Date(business.identity.created_at).toLocaleString())}</dd>
                  </div>
                </dl>
              </div>

              {/* Ownership */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Ownership</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Owner type</dt>
                    <dd className="capitalize">{renderVal(business.ownership.owner_type)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Owner name</dt>
                    <dd>{renderVal(`${business.ownership.owner_first_name} ${business.ownership.owner_last_name}`.trim())}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Phone</dt>
                    <dd className="font-mono text-xs flex items-center gap-1.5">
                      {renderVal(business.ownership.phone)}
                      {business.ownership.phone && (
                        <button type="button" onClick={() => copyToClipboard(business.ownership.phone, 'owner-phone')} className="cursor-pointer text-text-muted hover:text-text-primary">
                          {copiedKey === 'owner-phone' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">OTP Verified</dt>
                    <dd>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${business.ownership.phone_verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {business.ownership.phone_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Email</dt>
                    <dd>{renderVal(business.ownership.email)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">SUDO Users</dt>
                    <dd>{business.ownership.sudo_user_count}</dd>
                  </div>
                </dl>
              </div>

              {/* Location */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Location</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Region (Mkoa)</dt>
                    <dd>{renderVal(business.location.region)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">District (Wilaya)</dt>
                    <dd>{renderVal(business.location.district)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Ward (Kata)</dt>
                    <dd>{renderVal(business.location.ward)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Address text</dt>
                    <dd>{renderVal(business.location.address_text)}</dd>
                  </div>
                </dl>
              </div>

              {/* Compliance */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Compliance</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">TMDA Number</dt>
                    <dd className="font-mono text-xs flex items-center gap-1.5">
                      {renderVal(business.compliance.tmda_number)}
                      {business.compliance.tmda_number && (
                        <button type="button" onClick={() => copyToClipboard(business.compliance.tmda_number || '', 'tmda-num')} className="cursor-pointer text-text-muted hover:text-text-primary">
                          {copiedKey === 'tmda-num' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Pharmacy Council</dt>
                    <dd className="font-mono text-xs">{renderVal(business.compliance.pharmacy_council_no)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Status</dt>
                    <dd className="capitalize">{renderVal(business.compliance.verification_status)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Reviewed by</dt>
                    <dd>{renderVal(business.compliance.reviewed_by)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Reviewed at</dt>
                    <dd className="text-xs">{renderVal(business.compliance.reviewed_at ? new Date(business.compliance.reviewed_at).toLocaleString() : null)}</dd>
                  </div>
                </dl>
              </div>

              {/* Payments Config */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Payments Config</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Branches</dt>
                    <dd>{business.payments_config.branches_count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Lipa Namba</dt>
                    <dd className="font-mono">{renderVal(business.payments_config.lipa_namba)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Payment phone</dt>
                    <dd className="font-mono text-xs">{renderVal(business.payments_config.payment_number_masked)}</dd>
                  </div>
                </dl>
              </div>

              {/* Operations */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Operations</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Branch count</dt>
                    <dd>{business.operations.branch_count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Device count</dt>
                    <dd>{business.operations.device_count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Product count (Free cap 50)</dt>
                    <dd className={business.operations.product_count >= 45 ? 'text-amber-500 font-semibold' : ''}>
                      {business.operations.product_count} / {business.operations.product_cap}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Sync Health */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Sync Health</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Last sync at</dt>
                    <dd className="text-xs">{renderVal(business.sync_health.last_sync_at ? new Date(business.sync_health.last_sync_at).toLocaleString() : null)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Pending outbox</dt>
                    <dd>{business.sync_health.pending_outbox_count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">App version</dt>
                    <dd className="font-mono text-xs">{renderVal(business.sync_health.app_version)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Last error</dt>
                    <dd>{renderVal(business.sync_health.last_error)}</dd>
                  </div>
                </dl>
              </div>

              {/* Usage (30d) */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Usage (30d)</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Revenue (30d)</dt>
                    <dd className="font-mono">TZS {business.usage.revenue_30d.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Sales count (30d)</dt>
                    <dd>{business.usage.sales_count_30d}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Lab orders (30d)</dt>
                    <dd>{business.usage.lab_orders_30d}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {tab === 'billing' && (
            <div className="bg-surface p-8 rounded-xl border border-border text-center space-y-3">
              <CreditCard size={32} className="mx-auto text-text-muted opacity-40" />
              <h3 className="text-lg font-bold text-text-primary">Billing & Invoices</h3>
              <p className="text-sm text-text-muted">Subscription tier configuration and invoice history for {business.identity.name || id}.</p>
            </div>
          )}

          {/* Activity Tab */}
          {tab === 'activity' && (
            <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
              <h3 className="font-heading font-semibold text-text-primary text-sm">Admin Activity Log</h3>
              {!activity ? (
                <div className="h-20 animate-pulse bg-surface-hover rounded" />
              ) : activity.activity.length === 0 ? (
                <p className="text-sm text-text-muted py-8 text-center">No recorded admin activity for this business.</p>
              ) : (
                <div className="divide-y divide-border">
                  {activity.activity.map((act, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium text-text-primary">{act.action.replace(/_/g, ' ')}</span>
                        <p className="text-xs text-text-muted mt-0.5">By {act.admin}</p>
                      </div>
                      <time className="text-xs text-text-muted">{new Date(act.created_at).toLocaleString()}</time>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {tab === 'notes' && (
            <div className="bg-surface p-8 rounded-xl border border-border text-center space-y-3">
              <FileText size={32} className="mx-auto text-text-muted opacity-40" />
              <h3 className="text-lg font-bold text-text-primary">Admin Notes</h3>
              <p className="text-sm text-text-muted">Internal reviewer notes and annotations.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
