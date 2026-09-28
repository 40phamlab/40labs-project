import * as React from 'react';
import { DashboardGrid, DashboardSection, SearchInput, Skeleton, Alert } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { useDashboard } from '../../hooks/useDashboard';
import { KPIRows } from './components/KPIRows';
import { OverviewChartPanel } from './components/OverviewChartPanel';
import { BusinessHealthPanel } from './components/BusinessHealthPanel';
import { PatientsInTrackPanel } from './components/PatientsInTrackPanel';
import { PendingPanel } from './components/PendingPanel';
import { QuickActionsPanel } from './components/QuickActionsPanel';

export const DashboardScreen: React.FC = () => {
  const { summary, isLoading, isError, error, refetch } = useDashboard();
  const [searchQuery, setSearchQuery] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global search hotkey (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <Alert intent="danger" title={t('dashboard.errorLoading')}>
          <div className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : String(error)}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1 bg-danger text-white rounded text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t('dashboard.retry')}
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <DashboardGrid>
      {/* Main Column (~9 cols) */}
      <DashboardSection colSpan={9} className="space-y-6">
        {/* KPI Rows */}
        <KPIRows summary={summary} />

        {/* Overview Chart Panel */}
        <OverviewChartPanel summary={summary} />

        {/* Bottom Row: Business Health + Patients in Track */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BusinessHealthPanel summary={summary} />
          <PatientsInTrackPanel patients={summary.patientsInTrack} />
        </div>
      </DashboardSection>

      {/* Right Rail (~3 cols) */}
      <DashboardSection colSpan={3} className="space-y-6">
        {/* Global Search Input */}
        <div className="relative">
          <SearchInput
            ref={searchInputRef}
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
          {/* TODO: [reason: no global search index exists] [phase: post-MVP] */}
        </div>

        {/* Quick Actions Grid */}
        <QuickActionsPanel />

        {/* Pending Orders Panel */}
        <PendingPanel summary={summary} />
      </DashboardSection>
    </DashboardGrid>
  );
};
