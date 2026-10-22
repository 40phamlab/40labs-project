import * as React from 'react';
import {
  DataTable,
  ColumnDefinition,
  Badge,
  Button,
  Input,
  IconButton,
  Dropdown,
  DropdownMenuItem,
} from '@40labs/ui-components';
import { Search, Eye, MoreVertical, Download } from 'lucide-react';
import type { LabResult, LabOrder, Customer, TestCatalogEntry, LabSample } from '@40labs/types';
import { ResultDetailPanel } from './components/ResultDetailPanel';
import { ExportMenu } from './components/ExportMenu';
import { downloadResultsCsv } from './export/resultCsv';
import { downloadResultsJson } from './export/resultJson';
import { useLabStore } from '../../stores/useLabStore';

export interface ResultsScreenProps {
  results: LabResult[];
  orders: LabOrder[];
  customers: Customer[];
  testCatalog: TestCatalogEntry[];
  samples: LabSample[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  results,
  orders,
  customers,
  testCatalog,
  samples,
  loading,
  error,
  onRetry,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedResultIds, setSelectedResultIds] = React.useState<string[]>([]);
  const [inspectingResult, setInspectingResult] = React.useState<LabResult | null>(null);
  const [activeMenuResultId, setActiveMenuResultId] = React.useState<string | null>(null);

  // Filter results by search query (test name, patient name, result value)
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter((res) => {
      const order = orders.find((o) => o.id === res.lab_order_id);
      const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
      const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
      return (
        res.value.toLowerCase().includes(q) ||
        test?.name?.toLowerCase().includes(q) ||
        customer?.full_name?.toLowerCase().includes(q) ||
        res.id.toLowerCase().includes(q)
      );
    });
  }, [results, orders, customers, testCatalog, searchQuery]);

  const selectedResults = React.useMemo(
    () => results.filter((r) => selectedResultIds.includes(r.id)),
    [results, selectedResultIds]
  );

  const handleBulkCsv = () => {
    downloadResultsCsv(selectedResults.length > 0 ? selectedResults : results, orders, customers, testCatalog, samples, 'Bulk_Lab_Results_Export.csv');
  };

  const handleBulkJsonFull = async () => {
    await downloadResultsJson(selectedResults.length > 0 ? selectedResults : results, orders, customers, testCatalog, samples, 'full', 'Bulk_Lab_Results_full.json');
  };

  const handleBulkJsonDeidentified = async () => {
    await downloadResultsJson(selectedResults.length > 0 ? selectedResults : results, orders, customers, testCatalog, samples, 'deidentified', 'Bulk_Lab_Results_deidentified.json');
  };

  const columns: ColumnDefinition<LabResult>[] = React.useMemo(
    () => [
      {
        key: 'select',
        header: (
          <input
            type="checkbox"
            aria-label="Select all rows"
            checked={selectedResultIds.length === filteredResults.length && filteredResults.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedResultIds(filteredResults.map((r) => r.id));
              } else {
                setSelectedResultIds([]);
              }
            }}
          />
        ),
        render: (item) => (
          <input
            type="checkbox"
            aria-label={`Select row ${item.id}`}
            checked={selectedResultIds.includes(item.id)}
            onChange={(e) => {
              e.stopPropagation();
              setSelectedResultIds((prev) =>
                e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
              );
            }}
          />
        ),
      },
      {
        key: 'test',
        header: 'Test',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
          return <span className="font-bold text-text">{test?.name || 'Unknown Test'}</span>;
        },
      },
      {
        key: 'patient',
        header: 'Patient',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
          return <span className="font-medium text-text">{customer?.full_name || 'Unknown Patient'}</span>;
        },
      },
      {
        key: 'value',
        header: 'Result Value',
        render: (item) => <span className="font-mono font-bold text-text">{item.value}</span>,
      },
      {
        key: 'reference',
        header: 'Reference Range',
        render: (item) => <span className="font-mono text-xs text-text-muted">{item.reference_range || '—'}</span>,
      },
      {
        key: 'status',
        header: 'Flag',
        render: (item) =>
          item.is_out_of_range ? (
            <Badge variant="danger">Out of Range</Badge>
          ) : (
            <Badge variant="success">Normal</Badge>
          ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'w-24 text-right',
        render: (item) => {
          const isOpen = activeMenuResultId === item.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                intent="ghost"
                size="sm"
                leftIcon={<Eye size={14} />}
                onClick={() => setInspectingResult(item)}
              >
                View
              </Button>
              <Dropdown
                isOpen={isOpen}
                onClose={() => setActiveMenuResultId(null)}
                trigger={
                  <IconButton
                    icon={<MoreVertical size={16} />}
                    label="Result actions"
                    intent="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuResultId(isOpen ? null : item.id);
                    }}
                  />
                }
              >
                <DropdownMenuItem
                  label="View Details"
                  icon={<Eye size={14} className="text-primary" />}
                  onClick={() => {
                    setActiveMenuResultId(null);
                    setInspectingResult(item);
                  }}
                />
                <DropdownMenuItem
                  label="Trace"
                  icon={<Search size={14} className="text-primary" />}
                  onClick={() => {
                    setActiveMenuResultId(null);
                    const sample = samples.find((s) => s.lab_order_id === item.lab_order_id);
                    useLabStore.getState().setTraceSampleId(sample ? sample.id : item.lab_order_id);
                  }}
                />
              </Dropdown>
            </div>
          );
        },
      },
    ],
    [orders, testCatalog, customers, selectedResultIds, filteredResults, activeMenuResultId]
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search & Bulk Export Actions Bar */}
      <div className="flex items-center justify-between gap-4 bg-panel p-3 rounded-card border border-border/50">
        <div className="flex items-center gap-3 w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search results, test or patient..."
            leftIcon={<Search size={16} className="text-text-muted" />}
          />
        </div>

        <div className="flex items-center gap-3">
          {selectedResultIds.length > 0 && (
            <span className="text-xs font-mono text-primary font-medium">
              {selectedResultIds.length} selected
            </span>
          )}
          <ExportMenu
            results={selectedResults.length > 0 ? selectedResults : filteredResults}
            orders={orders}
            customers={customers}
            testCatalog={testCatalog}
            samples={samples}
            label={selectedResultIds.length > 0 ? `Export Selected (${selectedResultIds.length})` : 'Export All Filtered'}
          />
        </div>
      </div>

      {/* Results DataTable */}
      <div className="w-full">
        <DataTable
          data={filteredResults}
          columns={columns}
          loading={loading}
          error={error}
          onRetry={onRetry}
          emptyMessage="No laboratory results recorded."
        />
      </div>

      {/* Detail Panel */}
      <ResultDetailPanel
        result={inspectingResult}
        orders={orders}
        customers={customers}
        testCatalog={testCatalog}
        samples={samples}
        isOpen={!!inspectingResult}
        onClose={() => setInspectingResult(null)}
      />
    </div>
  );
};
