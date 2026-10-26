import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Server, Activity, FileText, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Smartphone } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface HealthCheckItem {
  check: string;
  status: 'ok' | 'degraded' | 'down';
  latency_ms: number;
  detail: string;
  checked_at: string;
  uptime_24h: number;
}

interface StateChangeItem {
  level: string;
  source: string;
  message: string;
  ts: string;
}

interface HealthResponse {
  overall: 'ok' | 'degraded' | 'down';
  last_checked: string | null;
  checks: HealthCheckItem[];
  state_changes: StateChangeItem[];
}

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

export function InfraPage() {
  const [activeTab, setActiveTab] = React.useState<'health' | 'devices' | 'logs'>('health');
  const [secondsAgo, setSecondsAgo] = React.useState(0);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery<HealthResponse>({
    queryKey: ['infra-health'],
    queryFn: () => apiFetch<HealthResponse>('/admin/v1/infra/health'),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery<{ devices: DeviceItem[] }>({
    queryKey: ['infra-devices-activity'],
    queryFn: () => apiFetch<{ devices: DeviceItem[] }>('/admin/v1/sync/devices'),
    refetchInterval: 15000,
  });

  // Timer for "Updated Xs ago"
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (dataUpdatedAt) {
        setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [dataUpdatedAt]);

  const renderStatusBanner = (overall: string) => {
    let bg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
    let icon = <CheckCircle2 size={24} className="text-emerald-500" />;
    let text = 'All Systems Operational';

    if (overall === 'degraded') {
      bg = 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      icon = <AlertTriangle size={24} className="text-amber-500" />;
      text = 'System Performance Degraded';
    } else if (overall === 'down') {
      bg = 'bg-rose-500/10 border-rose-500/30 text-rose-500';
      icon = <XCircle size={24} className="text-rose-500" />;
      text = 'Critical Infrastructure Outage';
    }

    return (
      <div className={`flex items-center justify-between p-6 rounded-xl border ${bg}`}>
        <div className="flex items-center gap-4">
          {icon}
          <div>
            <h2 className="text-lg font-heading font-bold">{text}</h2>
            <p className="text-xs opacity-80 mt-0.5">
              {data?.last_checked ? `Last checked: ${new Date(data.last_checked).toLocaleTimeString()}` : 'Checking...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">Updated {secondsAgo}s ago</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>
    );
  };

  const renderChip = (status: string) => {
    const s = status.toLowerCase();
    let bg = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (s === 'degraded' || s === 'stale') bg = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (s === 'down' || s === 'offline') bg = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase ${bg}`}>
        {s}
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

  // Compute app version distribution
  const versionCounts = React.useMemo(() => {
    if (!devicesData?.devices) return {};
    const map: Record<string, number> = {};
    for (const d of devicesData.devices) {
      const v = d.app_version && d.app_version.trim() ? d.app_version : 'Unknown';
      map[v] = (map[v] || 0) + 1;
    }
    return map;
  }, [devicesData]);

  const hasVersionData = Object.keys(versionCounts).some(v => v !== 'Unknown');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Infrastructure & Health</h1>
          <p className="text-sm text-text-muted mt-1">Real-time system health checks, node probes, and telemetry.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'health'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Server size={16} /> Health
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'devices'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Activity size={16} /> Devices activity
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'logs'
              ? 'border-action-primary text-action-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <FileText size={16} /> Logs
        </button>
      </div>

      {activeTab === 'health' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="p-12 space-y-4 animate-pulse">
              <div className="h-24 bg-surface-hover rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-40 bg-surface-hover rounded-xl" />
                <div className="h-40 bg-surface-hover rounded-xl" />
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-500 font-medium">Failed to load infrastructure health.</div>
          ) : data ? (
            <>
              {renderStatusBanner(data.overall)}

              {/* Check Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.checks.map((item) => (
                  <div key={item.check} className="bg-surface p-5 rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-text-primary uppercase text-xs tracking-wider">
                        {item.check}
                      </h3>
                      {renderChip(item.status)}
                    </div>

                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-text-muted">Latency</span>
                      <span className="font-mono font-semibold text-text-primary">{item.latency_ms} ms</span>
                    </div>

                    <p className="text-xs text-text-muted truncate" title={item.detail}>
                      {item.detail}
                    </p>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
                      <span>24h Uptime: <strong className="text-text-primary">{item.uptime_24h}%</strong></span>
                      <span className="font-mono text-[10px]">{new Date(item.checked_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* State Changes List */}
              <div className="bg-surface p-5 rounded-xl border border-border space-y-4">
                <h3 className="font-heading font-semibold text-text-primary text-sm">State Changes (Last 20)</h3>
                {data.state_changes.length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-sm">No state transitions recorded yet.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {data.state_changes.map((ev, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold ${ev.level === 'ERROR' ? 'bg-rose-500/10 text-rose-500' : ev.level === 'WARN' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {ev.level}
                          </span>
                          <span className="text-text-primary font-medium">{ev.message}</span>
                        </div>
                        <span className="text-text-muted font-mono">{new Date(ev.ts).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="space-y-6">
          {/* App Version Distribution Card */}
          <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
            <h3 className="font-heading font-semibold text-text-primary text-sm flex items-center gap-2">
              <Smartphone size={16} /> App Version Distribution
            </h3>
            {hasVersionData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {Object.entries(versionCounts).map(([ver, count]) => (
                  <div key={ver} className="bg-surface-hover p-3 rounded-lg border border-border">
                    <div className="text-xs text-text-muted">Version</div>
                    <div className="font-mono font-bold text-text-primary text-base">{ver}</div>
                    <div className="text-xs text-text-secondary mt-1">{count} device(s)</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-text-muted italic py-2">
                unknown — No app version telemetry reported by active devices yet.
              </div>
            )}
          </div>

          {/* Per-device last-seen timeline table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-heading font-semibold text-text-primary text-sm">Per-Device Last-Seen Timeline</h3>
            </div>
            {devicesLoading ? (
              <div className="p-12 text-center text-text-muted animate-pulse">Loading device activity...</div>
            ) : !devicesData?.devices || devicesData.devices.length === 0 ? (
              <div className="p-12 text-center text-text-muted">No device activity recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-hover border-b border-border text-xs uppercase text-text-muted font-heading">
                    <tr>
                      <th className="px-6 py-3">Business</th>
                      <th className="px-6 py-3">Device ID</th>
                      <th className="px-6 py-3">App Version</th>
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
                        <td className="px-6 py-4 font-mono text-xs text-text-secondary">{d.app_version || 'unknown'}</td>
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

      {activeTab === 'logs' && (
        <div className="p-12 bg-surface rounded-xl border border-border text-center text-text-muted">
          <p>Logs view placeholder.</p>
        </div>
      )}
    </div>
  );
}
