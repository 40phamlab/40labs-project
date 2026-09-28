import * as React from 'react';
import { Avatar, StatusBadge } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import type { PatientInTrack } from '../../../api/dashboardApi';

interface PatientsInTrackPanelProps {
  patients: PatientInTrack[];
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export const PatientsInTrackPanel: React.FC<PatientsInTrackPanelProps> = ({ patients }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

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
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3 h-full">
      <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text border-b border-border/30 pb-2">
        {t('dashboard.patientsInTrack')}
      </h3>

      {patients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6 text-xs text-text-muted italic">
          {t('dashboard.noPatientsInTrack')}
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
          {patients.map((patient) => {
            const config = getStatusConfig(patient.last_event);
            return (
              <div
                key={patient.customer_id}
                onClick={() => setActiveScreen('customers')}
                className="flex items-center justify-between p-2 rounded-card bg-surface-secondary hover:bg-surface-hover border border-border/20 transition-colors cursor-pointer group"
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
  );
};
