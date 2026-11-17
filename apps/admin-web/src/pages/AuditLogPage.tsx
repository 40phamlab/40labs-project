import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, ChevronLeft, ChevronRight, AlertCircle, Download, Filter } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { AdminAuditListResponse } from '@40labs/types';

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const targetType = searchParams.get('target_type') || '';
  const action = searchParams.get('action') || '';

  const queryString = searchParams.toString();

  const { data, isLoading, error, refetch } = useQuery<AdminAuditListResponse>({
    queryKey: ['admin-audit-log-page', queryString],
    queryFn: () => apiFetch<AdminAuditListResponse>(`/admin/v1/audit-log${queryString ? `?${queryString}` : ''}`),
  });

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const limit = data?.limit || 50;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Administrative Audit Log</h1>
          <p className="text-sm text-text-muted mt-1">Immutable audit trail of all administrative actions and mutations.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-text-muted" />
            <select
              value={targetType}
              onChange={(e) => handleFilterChange('target_type', e.target.value)}
              className="px-3 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-action-primary"
            >
              <option value="">All Target Types</option>
              <option value="business">Business</option>
              <option value="admin_user">Admin User</option>
              <option value="auth">Auth</option>
              <option value="sync">Sync</option>
            </select>
          </div>

          <select
            value={action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="px-3 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-action-primary"
          >
            <option value="">All Actions</option>
            <option value="business_verification_updated">Business Verification</option>
            <option value="admin_user_updated">Admin User Updated</option>
            <option value="admin_user_created">Admin User Created</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            const jsonStr = JSON.stringify(data?.data || [], null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <Download size={15} /> Export JSON
        </button>
      </div>

      {/* Table & States */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-surface-hover rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <AlertCircle size={32} className="mx-auto text-rose-500" />
            <p className="text-rose-500 font-medium">Failed to load audit log: {error.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <FileText size={32} className="mx-auto text-text-muted opacity-40" />
            <p className="text-text-primary font-medium">No audit records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50 text-xs text-text-muted font-medium uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Administrator</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Target ID</th>
                  <th className="p-4">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {data.data.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-hover transition-colors">
                    <td className="p-4 font-mono text-xs text-text-muted">
                      {new Date(record.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-text-primary">
                      {record.admin_email || 'System / Unknown'}
                    </td>
                    <td className="p-4 font-mono text-xs text-action-primary font-semibold">
                      {record.action}
                    </td>
                    <td className="p-4 uppercase text-xs font-semibold text-text-secondary">
                      {record.target_type}
                    </td>
                    <td className="p-4 font-mono text-xs text-text-muted">
                      {record.target_id}
                    </td>
                    <td className="p-4">
                      {record.payload ? (
                        <pre className="max-w-xs overflow-x-auto p-1.5 bg-app-bg border border-border rounded text-[11px] font-mono text-text-secondary">
                          {JSON.stringify(record.payload)}
                        </pre>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-surface-hover/20 text-sm">
            <span className="text-text-muted">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} records
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
