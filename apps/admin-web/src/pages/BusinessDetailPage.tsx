import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Copy, Check, AlertCircle, CreditCard, Activity, FileText } from 'lucide-react';
import { apiFetch, ApiClientError } from '../lib/api';
import type { AdminBusinessActivityResponse, AdminVerificationDecision } from '@40labs/types';

interface BusinessProfile {
  identity: {
    business_id: string;
    name?: string | null;
    logo_url?: string | null;
    scale?: string | null;
    role_scopes?: string | null;
    created_at?: string | null;
    profile_complete?: boolean;
  };
  ownership?: {
    owner_type?: string | null;
    owner_first_name?: string | null;
    owner_last_name?: string | null;
    phone?: string | null;
    phone_verified?: boolean;
    email?: string | null;
    sudo_user_count?: number;
  } | null;
  location?: {
    region?: string | null;
    district?: string | null;
    ward?: string | null;
    address_text?: string | null;
  } | null;
  compliance?: {
    tmda_number?: string | null;
    pharmacy_council_no?: string | null;
    verification_status?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    rejection_reason?: string | null;
  } | null;
  payments_config?: {
    branches_count?: number;
    lipa_namba?: string | null;
    payment_number_masked?: string | null;
  } | null;
  operations?: {
    branch_count?: number;
    branches?: Array<{ branch_id: string; name: string | null; region: string | null }>;
    user_count_by_role?: Record<string, number>;
    device_count?: number;
    product_count?: number;
    product_cap?: number;
  } | null;
  sync_health?: {
    last_sync_at?: string | null;
    pending_outbox_count?: number;
    app_version?: string | null;
    last_error?: string | null;
  } | null;
  usage?: {
    revenue_30d?: number;
    sales_count_30d?: number;
    lab_orders_30d?: number;
  } | null;
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
    retry: false,
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
    onError: (err: Error) => alert(`Verification failed: ${err.message}`),
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
    const name = business?.identity?.name || id;
    if (!window.confirm(`Confirm ${decision} for ${name}?`)) return;
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6 animate-pulse" aria-label="Loading business profile">
        <div className="h-10 w-32 bg-surface-hover rounded" />
        <div className="h-28 rounded-xl bg-surface-hover" />
        <div className="h-96 rounded-xl bg-surface-hover" />
      </div>
    );
  }

  const isNotFound = (error instanceof ApiClientError && error.status === 404) || !business;

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-12 text-center">
        <button type="button" onClick={() => navigate('/businesses')} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary cursor-pointer">
          <ArrowLeft size={16} /> Back to Businesses
        </button>
        <div className="p-12 text-center space-y-3 rounded-xl border border-border bg-surface">
          <Building2 size={40} className="mx-auto text-text-muted opacity-40" />
          <h2 className="text-xl font-bold text-text-primary">Business {id} not found</h2>
          <p className="text-sm text-text-muted">The requested business profile does not exist or was removed.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-12 text-center">
        <button type="button" onClick={() => navigate('/businesses')} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary cursor-pointer">
          <ArrowLeft size={16} /> Back to Businesses
        </button>
        <section className="space-y-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-8 text-center" role="alert">
          <AlertCircle size={40} className="mx-auto text-rose-500" />
          <p className="text-rose-500 font-medium">Failed to load business profile: {(error as Error).message}</p>
          <button type="button" onClick={() => refetch()} className="rounded-lg bg-action-primary px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90">
            Retry
          </button>
        </section>
      </div>
    );
  }

  const identity = business.identity || { business_id: id };
  const ownership = business.ownership || {};
  const location = business.location || {};
  const compliance = business.compliance || {};
  const syncHealth = business.sync_health || {};
  const profileComplete = Boolean(identity.profile_complete);
  const verificationStatus = (compliance.verification_status || 'pending').toLowerCase();
  const businessName = profileComplete && identity.name ? identity.name : 'Registration incomplete';

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <button type="button" onClick={() => navigate('/businesses')} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary cursor-pointer">
        <ArrowLeft size={16} /> Back to Businesses
      </button>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-text-primary font-bold overflow-hidden">
            {identity.logo_url ? (
              <img src={identity.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={24} className="text-action-primary" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={`text-xl font-heading font-bold ${profileComplete ? 'text-text-primary' : 'text-amber-500 italic'}`}>
                {businessName}
              </h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                verificationStatus === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
              </span>
              {!profileComplete && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Incomplete Profile
                </span>
              )}
              {identity.scale && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-action-primary/10 text-action-primary border border-action-primary/20 uppercase">
                  {identity.scale}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
              <span>ID: {identity.business_id}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(identity.business_id, 'header-id')}
                className="hover:text-text-primary cursor-pointer"
                title="Copy Business ID"
              >
                {copiedKey === 'header-id' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              {identity.role_scopes && (
                <>
                  <span>·</span>
                  <span>Role: {identity.role_scopes}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decide('verified')}
              disabled={!profileComplete || decisionMutation.isPending}
              title={!profileComplete ? 'Cannot verify business with incomplete profile (name, region, and TMDA number required)' : 'Verify business'}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
          {!profileComplete && (
            <span className="text-[11px] text-amber-500">
              Verification disabled: Profile incomplete
            </span>
          )}
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
                  {identity.business_id}
                  <button type="button" onClick={() => copyToClipboard(identity.business_id, 'identity-id')} className="cursor-pointer text-text-muted hover:text-text-primary">
                    {copiedKey === 'identity-id' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Name</dt>
                <dd>{renderVal(identity.name)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Scale</dt>
                <dd className="capitalize">{renderVal(identity.scale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Role scope</dt>
                <dd className="capitalize">{renderVal(identity.role_scopes)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Registered</dt>
                <dd className="text-xs">{renderVal(identity.created_at ? new Date(identity.created_at).toLocaleString() : null)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Last sync</dt>
                <dd className="text-xs">{renderVal(syncHealth.last_sync_at ? new Date(syncHealth.last_sync_at).toLocaleString() : 'Never synced')}</dd>
              </div>
            </dl>
          </div>

          {/* Ownership */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
            <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Ownership</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Owner type</dt>
                <dd className="capitalize">{renderVal(ownership.owner_type)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Owner name</dt>
                <dd>{renderVal(`${ownership.owner_first_name || ''} ${ownership.owner_last_name || ''}`.trim())}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Phone</dt>
                <dd className="font-mono text-xs flex items-center gap-1.5">
                  {renderVal(ownership.phone)}
                  {ownership.phone && (
                    <button type="button" onClick={() => copyToClipboard(ownership.phone || '', 'owner-phone')} className="cursor-pointer text-text-muted hover:text-text-primary">
                      {copiedKey === 'owner-phone' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">OTP Verified</dt>
                <dd>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${ownership.phone_verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {ownership.phone_verified ? 'Verified' : 'Unverified'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Email</dt>
                <dd>{renderVal(ownership.email)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">SUDO Users</dt>
                <dd>{ownership.sudo_user_count ?? '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Location */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
            <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">Location</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Region (Mkoa)</dt>
                <dd>{renderVal(location.region)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">District (Wilaya)</dt>
                <dd>{renderVal(location.district)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Ward (Kata)</dt>
                <dd>{renderVal(location.ward)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Address text</dt>
                <dd>{renderVal(location.address_text)}</dd>
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
                  {renderVal(compliance.tmda_number)}
                  {compliance.tmda_number && (
                    <button type="button" onClick={() => copyToClipboard(compliance.tmda_number || '', 'tmda-num')} className="cursor-pointer text-text-muted hover:text-text-primary">
                      {copiedKey === 'tmda-num' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Pharmacy Council</dt>
                <dd className="font-mono text-xs">{renderVal(compliance.pharmacy_council_no)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Status</dt>
                <dd className="capitalize">{renderVal(compliance.verification_status)}</dd>
              </div>
              {compliance.rejection_reason && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Rejection reason</dt>
                  <dd className="text-rose-500">{compliance.rejection_reason}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="bg-surface p-8 rounded-xl border border-border text-center space-y-3">
          <CreditCard size={32} className="mx-auto text-text-muted opacity-40" />
          <h3 className="font-heading font-semibold text-text-primary text-base">Billing Management</h3>
          <p className="text-sm text-text-muted">TODO: [billing + activity monitoring] [Admin Phase next]</p>
        </div>
      )}

      {tab === 'activity' && (
        <div className="bg-surface p-8 rounded-xl border border-border text-center space-y-3">
          <Activity size={32} className="mx-auto text-text-muted opacity-40" />
          <h3 className="font-heading font-semibold text-text-primary text-base">Activity & Audit Timeline</h3>
          <p className="text-sm text-text-muted">TODO: [billing + activity monitoring] [Admin Phase next]</p>
        </div>
      )}

      {tab === 'notes' && (
        <div className="bg-surface p-8 rounded-xl border border-border text-center space-y-3">
          <FileText size={32} className="mx-auto text-text-muted opacity-40" />
          <h3 className="font-heading font-semibold text-text-primary text-base">Administrative Notes</h3>
          <p className="text-sm text-text-muted">TODO: [billing + activity monitoring] [Admin Phase next]</p>
        </div>
      )}
    </main>
  );
}
