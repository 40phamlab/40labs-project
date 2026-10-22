import * as React from 'react';
import {
  DataTable,
  ColumnDefinition,
  Badge,
  Button,
  IconButton,
  Dropdown,
  DropdownMenuItem,
} from '@40labs/ui-components';
import { FileText, MoreVertical, Plus, Eye, Lock, Send, RefreshCw } from 'lucide-react';
import type { LabReport, LabOrder, Customer, LabResult, TestCatalogEntry, LabSample } from '@40labs/types';
import { formatDateTime } from '@40labs/i18n';
import { ReportBuilder } from './ReportBuilder';

export interface ReportsScreenProps {
  reports: LabReport[];
  orders: LabOrder[];
  customers: Customer[];
  results: LabResult[];
  testCatalog: TestCatalogEntry[];
  samples: LabSample[];
  users: any[];
  onCreateReport: (payload: { patientId: string; orderId: string; summaryNote?: string; resultIds: string[] }) => Promise<LabReport>;
  onFinalizeReport: (reportId: string, pin: string, summaryNote?: string) => Promise<LabReport>;
  onAmendReport: (reportId: string, pin: string, summaryNote?: string, resultIds?: string[]) => Promise<LabReport>;
  onForwardReport: (reportId: string, toUserId: string, note?: string) => Promise<unknown>;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  reports,
  orders,
  customers,
  results,
  testCatalog,
  samples,
  users,
  onCreateReport,
  onFinalizeReport,
  onAmendReport,
  onForwardReport,
  loading,
  error,
  onRetry,
}) => {
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<LabReport | null>(null);
  const [activeMenuReportId, setActiveMenuReportId] = React.useState<string | null>(null);

  const columns: ColumnDefinition<LabReport>[] = React.useMemo(
    () => [
      {
        key: 'id',
        header: 'Report ID',
        render: (item) => <span className="font-mono font-bold text-text">{item.id.substring(0, 12)}</span>,
      },
      {
        key: 'patient',
        header: 'Patient',
        render: (item) => {
          const customer = customers.find((c) => c.id === item.patient_id);
          return <span className="font-medium text-text">{customer?.full_name || item.patient_id}</span>;
        },
      },
      {
        key: 'version',
        header: 'Version',
        render: (item) => <span className="font-mono font-bold text-primary">v{item.version}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => {
          const isSuperseded = reports.some((r) => r.supersedes_report_id === item.id);
          if (isSuperseded) return <Badge variant="neutral">Superseded</Badge>;
          if (item.status === 'finalized') return <Badge variant="success">Finalized</Badge>;
          return <Badge variant="warning">Draft</Badge>;
        },
      },
      {
        key: 'date',
        header: 'Created / Finalized',
        render: (item) => (
          <span className="text-xs text-text-muted font-mono">
            {formatDateTime(item.finalized_at || item.created_at) || item.created_at}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'w-24 text-right',
        render: (item) => {
          const isOpen = activeMenuReportId === item.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                intent="ghost"
                size="sm"
                leftIcon={<Eye size={14} />}
                onClick={() => {
                  setSelectedReport(item);
                  setIsBuilderOpen(true);
                }}
              >
                View
              </Button>
              <Dropdown
                isOpen={isOpen}
                onClose={() => setActiveMenuReportId(null)}
                trigger={
                  <IconButton
                    icon={<MoreVertical size={16} />}
                    label="Report actions"
                    intent="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuReportId(isOpen ? null : item.id);
                    }}
                  />
                }
              >
                <DropdownMenuItem
                  label="Open Builder / Details"
                  icon={<FileText size={14} className="text-primary" />}
                  onClick={() => {
                    setActiveMenuReportId(null);
                    setSelectedReport(item);
                    setIsBuilderOpen(true);
                  }}
                />
              </Dropdown>
            </div>
          );
        },
      },
    ],
    [customers, reports, activeMenuReportId]
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between gap-4 bg-panel p-3 rounded-card border border-border/50">
        <div>
          <h3 className="font-heading font-bold text-text text-sm">Laboratory Reports & Sign-off</h3>
          <p className="text-xs text-text-muted">Finalized, signed immutable deliverables and versioned medical records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => {
              setSelectedReport(null);
              setIsBuilderOpen(true);
            }}
          >
            New Report
          </Button>
          <IconButton
            icon={<RefreshCw size={14} />}
            label="Refresh reports"
            intent="ghost"
            size="sm"
            onClick={onRetry}
          />
        </div>
      </div>

      <div className="w-full">
        <DataTable
          data={reports}
          columns={columns}
          loading={loading}
          error={error}
          onRetry={onRetry}
          emptyMessage="No laboratory reports created yet."
        />
      </div>

      <ReportBuilder
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setSelectedReport(null);
        }}
        orders={orders}
        customers={customers}
        results={results}
        testCatalog={testCatalog}
        samples={samples}
        users={users}
        onCreateReport={onCreateReport}
        onFinalizeReport={onFinalizeReport}
        onAmendReport={onAmendReport}
        onForwardReport={onForwardReport}
        existingReport={selectedReport}
      />
    </div>
  );
};
