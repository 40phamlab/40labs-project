import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface BusinessItem {
  business_id: string;
  name: string;
  region: string | null;
  tmda_number: string | null;
  tier: string;
  verification_status: string;
  last_sync: string | null;
  created_at: string;
}

interface ListResponse {
  items: BusinessItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function BusinessesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const q = searchParams.get('q') || '';
  const region = searchParams.get('region') || '';
  const tier = searchParams.get('tier') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const direction = searchParams.get('direction') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchState, setSearchState] = React.useState({ query: q, value: q });
  const searchInput = searchState.query === q ? searchState.value : q;
  const queryString = searchParams.toString();
  const { data, isLoading: loading, error, refetch: fetchBusinesses } = useQuery<ListResponse>({
    queryKey: ['admin-businesses', queryString],
    queryFn: () => apiFetch<ListResponse>(`/admin/v1/businesses${queryString ? `?${queryString}` : ''}`),
  });

  // Debounced search effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        const newParams = new URLSearchParams(searchParams);
        if (searchInput.trim()) {
          newParams.set('q', searchInput.trim());
        } else {
          newParams.delete('q');
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q, searchParams, setSearchParams]);

  const handleTabChange = (newStatus: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', newStatus);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSort = (column: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (sort === column) {
      newParams.set('direction', direction === 'asc' ? 'desc' : 'asc');
    } else {
      newParams.set('sort', column);
      newParams.set('direction', 'asc');
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const formatted = d.toLocaleString('en-TZ', {
        timeZone: 'Africa/Dar_es_Salaam',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const relative = getRelativeTime(d);
      return <span title={relative}>{formatted}</span>;
    } catch {
      return dateStr;
    }
  };

  const [nowMs, setNowMs] = React.useState(() => Date.now());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const getRelativeTime = (date: Date) => {
    const diffSec = Math.floor((nowMs - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatTier = (tier: string) => {
    switch (tier) {
      case 'class_1':
        return 'Class 1';
      case 'class_2':
        return 'Class 2';
      case 'class_3':
        return 'Class 3';
      case 'class_4_enterprise':
        return 'Enterprise';
      default:
        return 'Free';
    }
  };

  const renderVerificationChip = (st: string) => {
    const s = st.toLowerCase();
    let bg = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (s === 'verified') bg = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (s === 'rejected') bg = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${bg}`}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'verified', label: 'Verified' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Businesses</h1>
          <p className="text-sm text-text-muted mt-1">Manage registered pharmacies, labs, and suppliers across Tanzania.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const active = status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                active
                  ? 'border-action-primary text-action-primary font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchState({ query: q, value: e.target.value })}
            placeholder="Search by name, ID, or TMDA..."
            className="w-full pl-9 pr-4 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={region}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              if (e.target.value) newParams.set('region', e.target.value);
              else newParams.delete('region');
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
            className="px-3 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-action-primary"
          >
            <option value="">All Regions</option>
            <option value="Dar es Salaam">Dar es Salaam</option>
            <option value="Arusha">Arusha</option>
            <option value="Mwanza">Mwanza</option>
            <option value="Dodoma">Dodoma</option>
          </select>

          <select
            value={tier}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              if (e.target.value) newParams.set('tier', e.target.value);
              else newParams.delete('tier');
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
            className="px-3 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-action-primary"
          >
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="class_1">Class 1</option>
            <option value="class_2">Class 2</option>
            <option value="class_3">Class 3</option>
            <option value="class_4_enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Table & States */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-surface-hover rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-rose-500 font-medium">Error: {error.message}</p>
            <button
              type="button"
              onClick={() => fetchBusinesses()}
              className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Building2 size={32} className="mx-auto text-text-muted opacity-40" />
            <p className="text-text-primary font-medium">No businesses found matching your criteria.</p>
            <p className="text-sm text-text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50 text-xs text-text-muted font-medium uppercase tracking-wider">
                  <th onClick={() => handleSort('business_id')} className="p-4 cursor-pointer hover:text-text-primary">
                    Business ID
                  </th>
                  <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:text-text-primary">
                    Name
                  </th>
                  <th onClick={() => handleSort('region')} className="p-4 cursor-pointer hover:text-text-primary">
                    Region
                  </th>
                  <th className="p-4">TMDA Number</th>
                  <th onClick={() => handleSort('tier')} className="p-4 cursor-pointer hover:text-text-primary">
                    Tier
                  </th>
                  <th className="p-4">Status</th>
                  <th onClick={() => handleSort('last_sync')} className="p-4 cursor-pointer hover:text-text-primary">
                    Last Sync
                  </th>
                  <th onClick={() => handleSort('created_at')} className="p-4 cursor-pointer hover:text-text-primary">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {data.items.map((item) => (
                  <tr
                    key={item.business_id}
                    onClick={() => navigate(`/businesses/${item.business_id}`)}
                    className="hover:bg-surface-hover transition-colors cursor-pointer group"
                  >
                    <td className="p-4 font-mono text-xs text-action-primary font-medium">{item.business_id}</td>
                    <td className="p-4 font-medium text-text-primary group-hover:text-action-primary transition-colors">
                      {item.name}
                    </td>
                    <td className="p-4 text-text-muted">{item.region || '-'}</td>
                    <td className="p-4 font-mono text-xs text-text-muted">{item.tmda_number || '-'}</td>
                    <td className="p-4 text-text-muted uppercase text-xs font-semibold">{formatTier(item.tier)}</td>
                    <td className="p-4">{renderVerificationChip(item.verification_status)}</td>
                    <td className="p-4 text-text-muted text-xs">{formatDateTime(item.last_sync)}</td>
                    <td className="p-4 text-text-muted text-xs">{formatDateTime(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-surface-hover/20 text-sm">
            <span className="text-text-muted">
              Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total} businesses
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-text-primary font-medium px-2">
                Page {page} of {data.total_pages}
              </span>
              <button
                type="button"
                disabled={page >= data.total_pages}
                onClick={() => handlePageChange(page + 1)}
                className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
