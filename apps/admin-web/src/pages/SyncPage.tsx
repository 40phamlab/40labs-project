import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Smartphone, History, AlertOctagon, Filter } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface DeviceItem {
  device_id: string;
  workspace_id: string;
  business_id: string;
  business_name: string;
  region: string;
  last_seen_at: string | null;
  outbox_pending: number;
  app_version: string | null;
  status: 'healthy' | 'stale' | 'offline';
}

interface ChangeItem {
  change_id: string;
  entity: string;
  entity_id: string;
  device_id: string;
  workspace_id: string;
  business_name: string;
  version: number;
  received_at: string;
}

interface ChangesResponse {
  data: ChangeItem[];
  page: number;
  page_size: number;
  total: number;
}

interface FailureItem {
  business_id: string;
  count: number;
  failures: Array<{
    message: string;
    device_id: string | null;
    ts: string;
    meta: any;
  }>;
}

export function SyncPage() {
  const [activeTab, setActiveTab] = React.useState<'devices' | 'changes' | 'failures'>('devices');
  const [entityFilter, setEntityFilter] = React.useState('');
  const [businessFilter, setBusinessFilter] = React.useState('');

  const { data: devicesData, isLoading: devicesLoading, refetch: refetchDevices } = useQuery<{ devices: DeviceItem[] }>({
    queryKey: ['sync-devices'],
    queryFn: () => apiFetch<{ devices: DeviceItem[] }>('/admin/v1/sync/devices'),
    refetchInterval: 15000,
  });

  const { data: changesData, isLoading: changesLoading, refetch: refetchChanges } = useQuery<ChangesResponse>({
    queryKey: ['sync-changes', entityFilter, businessFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (entityFilter) params.set('entity', entityFilter);
      if (businessFilter) params.set('business_id', businessFilter);
      return apiFetch<ChangesResponse>(`/admin/v1/sync/changes?${params.toString()}`);
    },
  });

  const { data: failuresData, isLoading: failuresLoading, refetch: refetchFailures } = useQuery<{ failures: FailureItem[] }>({
    queryKey: ['sync-failures'],
    queryFn: () => apiFetch<{ failures: FailureItem[] }>('/admin/v1/sync/failures'),
    refetchInterval: 15000,
  });

  const renderChip = (status: string) => {
    let bg = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (status === 'stale') bg = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (status === 'offline') bg = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase ${bg}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-TZ', {
        timeZone: 'Africa/Dar_es_Salaam',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Sync Management</h1>
          <p className="text-sm text-text-muted mt-1">Monitor connected devices, real-time sync changes, and push conflicts/rejections.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'devices'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Smartphone size={16} /> Devices ({devicesData?.devices?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('changes')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'changes'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <History size={16} /> Recent Changes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('failures')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'failures'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <AlertOctagon size={16} /> Failures ({failuresData?.failures?.reduce((acc, f) => acc + f.count, 0) || 0})
        </button>
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => refetchDevices()}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Devices
            </button>
          </div>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {devicesLoading ? (
              <div className="p-12 text-center text-text-muted animate-pulse">Loading sync devices...</div>
            ) : !devicesData?.devices || devicesData.devices.length === 0 ? (
              <div className="p-12 text-center text-text-muted">No connected sync devices found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-hover border-b border-border text-xs uppercase text-text-muted font-heading">
                    <tr>
                      <th className="px-6 py-3">Business</th>
                      <th className="px-6 py-3">Device ID</th>
                      <th className="px-6 py-3">App Version</th>
                      <th className="px-6 py-3">Outbox Pending</th>
                      <th className="px-6 py-3">Last Seen</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {devicesData.devices.map((d) => (
                      <tr key={d.device_id} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-text-primary">
                          <div>{d.business_name}</div>
                          <div className="text-xs text-text-muted font-mono">{d.business_id}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-text-secondary">{d.device_id}</td>
                        <td className="px-6 py-4 font-mono text-xs text-text-secondary">{d.app_version || 'Unknown'}</td>
                        <td className="px-6 py-4 font-mono text-xs text-text-secondary">{d.outbox_pending}</td>
                        <td className="px-6 py-4 text-xs text-text-secondary">{formatDate(d.last_seen_at)}</td>
                        <td className="px-6 py-4">{renderChip(d.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Changes Tab */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-surface p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter size={16} className="text-text-muted" />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none"
              >
                <option value="">All Entities</option>
                <option value="business">business</option>
                <option value="inventory_item">inventory_item</option>
                <option value="price">price</option>
                <option value="price_history">price_history</option>
                <option value="daily_summary">daily_summary</option>
              </select>
              <input
                type="text"
                placeholder="Filter by Business ID..."
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value)}
                className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => refetchChanges()}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Changes
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {changesLoading ? (
              <div className="p-12 text-center text-text-muted animate-pulse">Loading sync changes...</div>
            ) : !changesData?.data || changesData.data.length === 0 ? (
              <div className="p-12 text-center text-text-muted">No sync changes found matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-hover border-b border-border text-xs uppercase text-text-muted font-heading">
                    <tr>
                      <th className="px-6 py-3">Change ID</th>
                      <th className="px-6 py-3">Entity</th>
                      <th className="px-6 py-3">Business</th>
                      <th className="px-6 py-3">Version</th>
                      <th className="px-6 py-3">Received At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {changesData.data.map((c) => (
                      <tr key={c.change_id} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-text-primary">{c.change_id}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-action-primary/10 text-action-primary rounded text-xs font-mono font-semibold">
                            {c.entity}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-text-primary">
                          <div>{c.business_name}</div>
                          <div className="text-xs text-text-muted font-mono">{c.workspace_id}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-text-secondary">{c.version}</td>
                        <td className="px-6 py-4 text-xs text-text-secondary">{formatDate(c.received_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Failures Tab */}
      {activeTab === 'failures' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => refetchFailures()}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Failures
            </button>
          </div>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {failuresLoading ? (
              <div className="p-12 text-center text-text-muted animate-pulse">Loading sync failures...</div>
            ) : !failuresData?.failures || failuresData.failures.length === 0 ? (
              <div className="p-12 text-center text-text-muted">No sync failures or rejected pushes recorded.</div>
            ) : (
              <div className="divide-y divide-border">
                {failuresData.failures.map((group, idx) => (
                  <div key={idx} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-heading font-semibold text-text-primary flex items-center gap-2">
                        <span>Workspace / Business:</span>
                        <span className="font-mono text-xs bg-surface-hover px-2 py-0.5 rounded">{group.business_id}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-xs font-bold">
                        {group.count} failures
                      </span>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-rose-500/30">
                      {group.failures.map((f, fIdx) => (
                        <div key={fIdx} className="text-xs space-y-1 bg-surface-hover p-3 rounded-lg">
                          <div className="flex items-center justify-between text-text-muted font-mono text-[11px]">
                            <span>Device: {f.device_id || 'unknown'}</span>
                            <span>{formatDate(f.ts)}</span>
                          </div>
                          <div className="text-text-primary font-medium">{f.message}</div>
                          {f.meta && (
                            <pre className="text-[10px] font-mono text-text-muted bg-surface p-2 rounded overflow-x-auto">
                              {JSON.stringify(f.meta, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
