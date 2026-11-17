import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Copy, Check, AlertCircle, CreditCard, Activity, FileText } from 'lucide-react';
import { apiFetch, ApiClientError } from '../lib/api';
import type { AdminVerificationDecision } from '@40labs/types';

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
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>('section-identity');

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

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    const originalTitle = document.title;
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      document.title = `40Labs-Business-Report-${id}-${dateStr}.pdf`;
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.print();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export PDF report. Please try again.');
    } finally {
      document.title = originalTitle;
      setIsExporting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      <nav className="flex gap-1 overflow-x-auto border-b border-border mt-4 mb-6 pt-2" aria-label="Business profile sections">
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
        <div className="space-y-6">
          {/* Sticky Section Index */}
          <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border py-2 px-4 flex items-center gap-4 text-xs font-medium text-text-muted no-print rounded-lg shadow-sm">
            <span className="text-text-primary font-semibold">Jump to:</span>
            {[
              { id: 'section-identity', label: 'Identity' },
              { id: 'section-ownership', label: 'Ownership' },
              { id: 'section-location', label: 'Location' },
              { id: 'section-compliance', label: 'Compliance' },
              { id: 'section-sync', label: 'Sync' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`hover:text-text-primary cursor-pointer transition-colors ${
                  activeSection === sec.id ? 'text-action-primary font-semibold underline' : ''
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          <div className="bg-surface p-8 rounded-xl border border-border space-y-6 print-report-container">
            {/* Print Header */}
            <div className="hidden print:block text-center border-b border-border pb-6 mb-6">
              <h1 className="text-2xl font-bold font-heading text-text-primary">40Labs Business Overview Report</h1>
              <p className="text-xs text-text-muted mt-1">Generated on {new Date().toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })} (Africa/Dar_es_Salaam)</p>
              <p className="text-xs text-text-muted mt-0.5">Confidential — 40Labs internal. Contains business data only; no patient data.</p>
            </div>

            {/* Header Summary Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-surface-hover border border-border print-section">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold font-heading text-text-primary">{businessName}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    verificationStatus === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                  </span>
                  {identity.scale && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-action-primary/10 text-action-primary border border-action-primary/20 uppercase">
                      {identity.scale}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <span>ID: {identity.business_id}</span>
                  <button type="button" onClick={() => copyToClipboard(identity.business_id, 'report-id')} className="hover:text-text-primary cursor-pointer no-print">
                    {copiedKey === 'report-id' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <span>·</span>
                  <span>Last Sync: {syncHealth.last_sync_at ? new Date(syncHealth.last_sync_at).toLocaleString() : 'Never synced'}</span>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-action-primary text-white rounded-lg text-xs font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50 no-print shadow-sm"
                >
                  {isExporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText size={14} /> Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {exportError && (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center justify-between no-print">
                <span>{exportError}</span>
                <button type="button" onClick={() => setExportError(null)} className="underline font-semibold cursor-pointer">Dismiss</button>
              </div>
            )}

            {exportSuccess && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs no-print">
                Business overview report generated successfully. Check your browser download / print dialogue.
              </div>
            )}

            {/* Section 1: Identity */}
            <section id="section-identity" className="space-y-4 print-section">
              <div className="border-b border-border pb-2">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">1. Identity & Scale</h3>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Business ID</dt>
                  <dd className="font-mono text-xs flex items-center gap-1.5">
                    {identity.business_id}
                    <button type="button" onClick={() => copyToClipboard(identity.business_id, 'id-copy')} className="cursor-pointer text-text-muted hover:text-text-primary no-print">
                      {copiedKey === 'id-copy' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Business Name</dt>
                  <dd>{renderVal(identity.name)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Scale / Tier</dt>
                  <dd className="capitalize">{renderVal(identity.scale)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Role Scope</dt>
                  <dd className="capitalize">{renderVal(identity.role_scopes)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Registered Date</dt>
                  <dd className="text-xs">{renderVal(identity.created_at ? new Date(identity.created_at).toLocaleString() : null)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Last Sync</dt>
                  <dd className="text-xs">{renderVal(syncHealth.last_sync_at ? new Date(syncHealth.last_sync_at).toLocaleString() : 'Never synced')}</dd>
                </div>
              </dl>
            </section>

            <hr className="border-border my-6" />

            {/* Section 2: Ownership */}
            <section id="section-ownership" className="space-y-4 print-section">
              <div className="border-b border-border pb-2">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">2. Ownership & Contact</h3>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Owner Type</dt>
                  <dd className="capitalize">{renderVal(ownership.owner_type)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Owner Name</dt>
                  <dd>{renderVal(`${ownership.owner_first_name || ''} ${ownership.owner_last_name || ''}`.trim())}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Phone Number</dt>
                  <dd className="font-mono text-xs flex items-center gap-1.5">
                    {renderVal(ownership.phone)}
                    {ownership.phone && (
                      <button type="button" onClick={() => copyToClipboard(ownership.phone || '', 'phone-copy')} className="cursor-pointer text-text-muted hover:text-text-primary no-print">
                        {copiedKey === 'phone-copy' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">OTP Verified</dt>
                  <dd>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ownership.phone_verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {ownership.phone_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Email Address</dt>
                  <dd>{renderVal(ownership.email)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">SUDO Users</dt>
                  <dd>{ownership.sudo_user_count ?? '—'}</dd>
                </div>
              </dl>
            </section>

            <hr className="border-border my-6" />

            {/* Section 3: Location */}
            <section id="section-location" className="space-y-4 print-section">
              <div className="border-b border-border pb-2">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">3. Location</h3>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Region (Mkoa)</dt>
                  <dd>{renderVal(location.region)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">District (Wilaya)</dt>
                  <dd>{renderVal(location.district)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Ward (Kata)</dt>
                  <dd>{renderVal(location.ward)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Address Text</dt>
                  <dd>{renderVal(location.address_text)}</dd>
                </div>
              </dl>
            </section>

            <hr className="border-border my-6" />

            {/* Section 4: Compliance */}
            <section id="section-compliance" className="space-y-4 print-section">
              <div className="border-b border-border pb-2">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">4. Compliance & Regulatory</h3>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">TMDA Number</dt>
                  <dd className="font-mono text-xs flex items-center gap-1.5">
                    {renderVal(compliance.tmda_number)}
                    {compliance.tmda_number && (
                      <button type="button" onClick={() => copyToClipboard(compliance.tmda_number || '', 'tmda-copy')} className="cursor-pointer text-text-muted hover:text-text-primary no-print">
                        {copiedKey === 'tmda-copy' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Pharmacy Council Number</dt>
                  <dd className="font-mono text-xs">{renderVal(compliance.pharmacy_council_no)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Verification Status</dt>
                  <dd className="capitalize">{renderVal(compliance.verification_status)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Reviewed By</dt>
                  <dd>{renderVal(compliance.reviewed_by)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Review Date</dt>
                  <dd className="text-xs">{renderVal(compliance.reviewed_at ? new Date(compliance.reviewed_at).toLocaleString() : null)}</dd>
                </div>
                {compliance.rejection_reason && (
                  <div className="flex justify-between py-1 border-b border-border/40 md:col-span-2">
                    <dt className="text-text-muted">Rejection Reason</dt>
                    <dd className="text-rose-500">{compliance.rejection_reason}</dd>
                  </div>
                )}
              </dl>
            </section>

            <hr className="border-border my-6" />

            {/* Section 5: Sync & Subscription */}
            <section id="section-sync" className="space-y-4 print-section">
              <div className="border-b border-border pb-2">
                <h3 className="font-heading font-semibold text-text-primary text-sm uppercase tracking-wider">5. Sync & Subscription</h3>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Subscription Tier</dt>
                  <dd className="uppercase font-semibold">{renderVal(identity.scale)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Last Sync Timestamp</dt>
                  <dd className="text-xs">{renderVal(syncHealth.last_sync_at ? new Date(syncHealth.last_sync_at).toLocaleString() : 'Never synced')}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">App Version / Device</dt>
                  <dd className="font-mono text-xs">{renderVal(syncHealth.app_version)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <dt className="text-text-muted">Branch Count</dt>
                  <dd>{renderVal(business.operations?.branch_count ?? business.payments_config?.branches_count)}</dd>
                </div>
              </dl>
            </section>

            {/* Print Footer */}
            <div className="hidden print:block text-center border-t border-border pt-6 mt-8 text-xs text-text-muted">
              <p>Confidential — 40Labs internal. Contains business data only; no patient data.</p>
              <p className="mt-1">Business ID: {identity.business_id} · Page 1 of 1</p>
            </div>
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
