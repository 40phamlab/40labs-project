import * as React from 'react';
import { ReactFlow, Controls, MiniMap, Background, useNodesState, useEdgesState, Node } from '@xyflow/react';
import '@xyflow/react/style.css';
import { buildTraceGraph } from './buildTraceGraph';
import { TraceTimeline } from './TraceTimeline';
import { PatientNode } from './nodes/PatientNode';
import { OrderNode } from './nodes/OrderNode';
import { SampleNode } from './nodes/SampleNode';
import { TestNode } from './nodes/TestNode';
import { ResultNode } from './nodes/ResultNode';
import { ReportNode } from './nodes/ReportNode';
import { StaffNode } from './nodes/StaffNode';
import { QcNode } from './nodes/QcNode';
import { PrescriptionNode } from './nodes/PrescriptionNode';
import { Button, FilterTabs } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import type { LabSample, LabOrder, LabResult, LabReport, LabReportForward, TestCatalogEntry, LabQcEquipment, LabQcRecord, SampleEvent, Customer } from '@40labs/types';
import { FileText, FileCheck, RefreshCw, X } from 'lucide-react';

const nodeTypes = {
  patient: PatientNode,
  order: OrderNode,
  sample: SampleNode,
  test: TestNode,
  result: ResultNode,
  report: ReportNode,
  staff: StaffNode,
  qc: QcNode,
  prescription: PrescriptionNode,
};

interface TraceViewProps {
  sampleId: string;
  samples: LabSample[];
  orders: LabOrder[];
  customers: Customer[];
  results: LabResult[];
  reports: LabReport[];
  reportForwards: LabReportForward[];
  catalog: TestCatalogEntry[];
  qcData?: { equipment: LabQcEquipment[]; records: LabQcRecord[] };
  sampleEvents?: SampleEvent[];
  onOpenResult?: (resultId: string) => void;
  onOpenReport?: (reportId: string) => void;
  onRecollect?: (orderId: string) => void;
  onBack?: () => void;
}

export const TraceView: React.FC<TraceViewProps> = ({
  sampleId,
  samples,
  orders,
  customers,
  results,
  reports,
  reportForwards,
  catalog,
  qcData,
  sampleEvents = [],
  onOpenResult,
  onOpenReport,
  onRecollect,
  onBack,
}) => {
  const [activeTab, setActiveTab] = React.useState<'graph' | 'timeline'>('graph');
  const [selectedNodeData, setSelectedNodeData] = React.useState<any | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(() => {
    return buildTraceGraph({
      sampleId,
      samples,
      orders,
      customers,
      results,
      reports,
      reportForwards,
      catalog,
      qcData,
      sampleEvents,
    });
  }, [sampleId, samples, orders, customers, results, reports, reportForwards, catalog, qcData, sampleEvents]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeData(node.data);
  };

  const sample = samples.find((s) => s.id === sampleId);
  const order = sample ? orders.find((o) => o.id === sample.lab_order_id) : null;

  return (
    <div className="flex flex-col h-full w-full bg-panel overflow-hidden">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-panel-strong/30 shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button type="button" intent="neutral" size="sm" onClick={onBack}>
              ← Back
            </Button>
          )}
          <h1 className="font-heading font-bold text-lg text-text">
            {t('lab.trace.title') || 'Lab Trace & Chain of Custody'}
          </h1>
          <FilterTabs
            tabs={[
              { id: 'graph', label: t('lab.trace.graph') || 'Graph' },
              { id: 'timeline', label: t('lab.trace.timeline') || 'Timeline' },
            ]}
            activeTabId={activeTab}
            onChange={(id) => setActiveTab(id as 'graph' | 'timeline')}
          />
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-1 min-h-0 min-w-0 relative">
        <div className="flex-1 h-full min-h-0">
          {activeTab === 'graph' ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background gap={16} size={1} />
            </ReactFlow>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <TraceTimeline events={sampleEvents.filter((ev) => ev.sample_id === sampleId)} />
            </div>
          )}
        </div>

        {/* Right Side Panel */}
        {selectedNodeData && (
          <div className="w-80 border-l border-border bg-panel p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text text-sm">
                {t('lab.trace.nodeDetails') || 'Node Details'}
              </h3>
              <Button type="button" intent="ghost" size="sm" onClick={() => setSelectedNodeData(null)}>
                <X size={16} />
              </Button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-panel-strong/40 rounded-card border border-border/50">
                <span className="text-text-muted font-mono block mb-1">TYPE</span>
                <span className="font-bold text-text uppercase font-mono">{selectedNodeData.type}</span>
              </div>

              <div className="p-3 bg-panel-strong/40 rounded-card border border-border/50">
                <span className="text-text-muted font-mono block mb-1">SUMMARY</span>
                <span className="font-bold text-text">{selectedNodeData.label}</span>
              </div>

              {selectedNodeData.result && (
                <div className="p-3 bg-panel-strong/40 rounded-card border border-border/50">
                  <span className="text-text-muted font-mono block mb-1">VALUE</span>
                  <span className="font-mono font-bold text-text text-sm">{selectedNodeData.result.value}</span>
                  {onOpenResult && (
                    <Button
                      type="button"
                      intent="primary"
                      size="sm"
                      className="mt-3 w-full"
                      leftIcon={<FileCheck size={14} />}
                      onClick={() => onOpenResult(selectedNodeData.result.id)}
                    >
                      {t('lab.trace.openResult') || 'Open Result'}
                    </Button>
                  )}
                </div>
              )}

              {selectedNodeData.report && (
                <div className="p-3 bg-panel-strong/40 rounded-card border border-border/50">
                  <span className="text-text-muted font-mono block mb-1">REPORT</span>
                  <span className="font-bold text-text">v{selectedNodeData.report.version} — {selectedNodeData.report.status}</span>
                  {onOpenReport && (
                    <Button
                      type="button"
                      intent="primary"
                      size="sm"
                      className="mt-3 w-full"
                      leftIcon={<FileText size={14} />}
                      onClick={() => onOpenReport(selectedNodeData.report.id)}
                    >
                      {t('lab.trace.openReport') || 'Open Report'}
                    </Button>
                  )}
                </div>
              )}

              {selectedNodeData.sample && onRecollect && order && (
                <div className="p-3 bg-panel-strong/40 rounded-card border border-border/50">
                  <Button
                    type="button"
                    intent="accent"
                    size="sm"
                    className="w-full"
                    leftIcon={<RefreshCw size={14} />}
                    onClick={() => onRecollect(order.id)}
                  >
                    {t('lab.trace.recollect') || 'Recollect'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
