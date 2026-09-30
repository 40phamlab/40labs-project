import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { Avatar, StatusBadge } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import type { DashboardSummary, PatientInTrack } from '../../../devData/dashboard/summary';

interface BottomRowProps {
  summary: DashboardSummary;
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return t('dashboard.timeJustNow');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('dashboard.timeMinutesAgo').replace('{n}', String(diffMin));
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t('dashboard.timeHoursAgo').replace('{n}', String(diffHour));
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return t('dashboard.timeYesterday');
  return t('dashboard.timeDaysAgo').replace('{n}', String(diffDay));
}

export const BottomRow: React.FC<BottomRowProps> = ({ summary }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const setFilterExpired = useInventoryStore((s) => s.setFilterExpired);

  const handleViewExpired = () => {
    setFilterExpired(true);
    setActiveScreen('inventory');
  };

  const handleViewEmpty = () => {
    setFilterExpired(false);
    setActiveScreen('inventory');
  };

  const handleViewTotal = () => {
    setFilterExpired(false);
    setActiveScreen('inventory');
  };

  const patients = summary.patientsInTrack;

  const getStatusConfig = (lastEvent: PatientInTrack['last_event']) => {
    switch (lastEvent) {
      case 'dispensed':
        return { status: 'success' as const, label: t('dashboard.dispensed') };
      case 'lab_ordered':
        return { status: 'pending' as const, label: t('dashboard.labOrdered') };
      case 'lab_ready':
        return { status: 'active' as const, label: t('dashboard.labReady') };
      default:
        return { status: 'info' as const, label: lastEvent };
    }
  };

  return (
    <div className="h-[200px] lg:h-[210px] shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Business Health (~5 cols) */}
      <div className="lg:col-span-5 bg-panel rounded-card border border-border/40 p-4 flex flex-col justify-between elevation-raised min-h-0">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text pb-1 border-b border-border/30">
          {t('dashboard.businessHealth')}
        </h3>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 flex-1 pt-1">
          {/* Total Stock */}
          <div className="flex flex-col justify-between group cursor-pointer" onClick={handleViewTotal}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {t('dashboard.totalStock')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {t('dashboard.view')} <ArrowRight size={9} />
              </span>
            </div>
            <span className="text-lg font-mono font-bold text-text">
              {summary.totalStock.toLocaleString()}
            </span>
          </div>

          {/* Categories */}
          <div className="flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {t('dashboard.categories')}
            </span>
            <span className="text-lg font-mono font-bold text-text">
              {summary.categories}
            </span>
          </div>

          {/* Empty */}
          <div className="flex flex-col justify-between group cursor-pointer" onClick={handleViewEmpty}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {t('dashboard.emptyItems')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {t('dashboard.view')} <ArrowRight size={9} />
              </span>
            </div>
            <span className={`text-lg font-mono font-bold ${summary.emptyItems > 0 ? 'text-accent' : 'text-text'}`}>
              {summary.emptyItems}
            </span>
          </div>

          {/* Expire */}
          <div className="flex flex-col justify-between group cursor-pointer" onClick={handleViewExpired}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {t('dashboard.expiredItems')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {t('dashboard.view')} <ArrowRight size={9} />
              </span>
            </div>
            <span className={`text-lg font-mono font-bold ${summary.expiredItems > 0 ? 'text-danger' : 'text-text'}`}>
              {summary.expiredItems}
            </span>
          </div>
        </div>
      </div>

      {/* Patients in Track (~7 cols) */}
      <div className="lg:col-span-7 bg-panel rounded-card border border-border/40 p-4 flex flex-col elevation-raised min-h-0">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text pb-1 border-b border-border/30 mb-2">
          {t('dashboard.patientsInTrack')}
        </h3>

        {patients.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-text-muted italic">
            {t('dashboard.noPatientsInTrack')}
          </div>
        ) : (
          <div className="divide-y divide-border/20 overflow-y-auto flex-1 pr-1">
            {patients.map((patient) => {
              const config = getStatusConfig(patient.last_event);
              return (
                <div
                  key={patient.customer_id}
                  onClick={() => setActiveScreen('customers')}
                  className="flex items-center justify-between py-2 px-1 hover:bg-surface-hover/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={patient.name} size="sm" tone="primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                        {patient.name}
                      </p>
                      <span className="text-[10px] text-text-muted font-mono">
                        {formatRelativeTime(patient.last_event_at)}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={config.status} label={config.label} size="sm" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
