import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../lib/api';

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<any>(`/admin/v1/businesses/${id}`)
      .then((data) => {
        setBusiness(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load business details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/businesses')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Businesses
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-surface-hover rounded w-1/3" />
          <div className="h-48 bg-surface-hover rounded" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 space-y-3">
          <p>Error: {error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-500 text-white rounded text-sm font-medium hover:bg-rose-600 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : business ? (
        <div className="space-y-6">
          <div className="flex items-start justify-between bg-surface p-6 rounded-xl border border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-heading font-bold text-text-primary">{business.name}</h1>
                <span className="font-mono text-xs px-2.5 py-1 bg-surface-hover rounded text-text-muted">
                  {business.business_id}
                </span>
              </div>
              <p className="text-sm text-text-muted">
                Region: <span className="text-text-primary">{business.region || 'N/A'}</span> · TMDA Number:{' '}
                <span className="font-mono text-text-primary">{business.tmda_number || 'N/A'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {business.verification_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface rounded-lg border border-border">
              <span className="text-xs text-text-muted">Pricing Tier</span>
              <p className="text-lg font-heading font-semibold text-text-primary mt-1 uppercase">{business.tier}</p>
            </div>
            <div className="p-4 bg-surface rounded-lg border border-border">
              <span className="text-xs text-text-muted">Created At</span>
              <p className="text-sm font-medium text-text-primary mt-1">{business.created_at}</p>
            </div>
            <div className="p-4 bg-surface rounded-lg border border-border">
              <span className="text-xs text-text-muted">Rejection Reason</span>
              <p className="text-sm text-text-primary mt-1">{business.rejection_reason || 'None'}</p>
            </div>
          </div>

          <div className="p-6 bg-surface rounded-xl border border-border text-center text-text-muted">
            <p>Business detail views (Profile, Stock & Prices, Sync, Activity) placeholder.</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted">Business not found.</div>
      )}
    </div>
  );
}
