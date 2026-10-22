import * as React from 'react';
import {
  PageToolbar,
  DataTable,
  ColumnDefinition,
  Badge,
  KPITile,
  IconButton,
  Button,
  type SubNavSection,
} from '@40labs/ui-components';
import { ContextualSidebar } from '../../components/ContextualSidebar';
import { TabContainer } from '../../components/TabContainer';
import {
  LayoutDashboard,
  ClipboardList,
  TestTube,
  FileCheck,
  BookOpen,
  Sliders,
  BarChart3,
  Store,
  Shield,
  History,
  AlertTriangle,
  Clock,
  User as UserIcon,
  Activity,
  RefreshCw,
  Plus,
  FileText,
  GitBranch,
} from 'lucide-react';
import type { LabResult, TestCatalogEntry, LabOrderStatus, LabSampleStatus } from '@40labs/types';
import { LabDashboard } from './components/LabDashboard';
import { LabOrdersList } from './components/LabOrdersList';
import { LabSamplesList } from './components/LabSamplesList';
import { ResultsScreen } from './ResultsScreen';
import { ReportsScreen } from './reports/ReportsScreen';
import { NewLabOrderModal } from './components/NewLabOrderModal';
import { useLab } from '../../hooks/useLab';
import { useCustomers } from '../../hooks/useCustomers';
import { NewTestCatalogModal } from './components/NewTestCatalogModal';
import { LabQcPanel } from './components/LabQcPanel';
import { LabOrderActionModal } from './components/LabOrderActionModal';
import { formatDateTime } from '@40labs/i18n';
import { TraceView } from '../lab/trace/TraceView';
import { useLabStore } from '../../stores/useLabStore';
import { WorkflowBuilder } from '../lab/workflow/WorkflowBuilder';
import { labWorkflowApi } from '../../api/labWorkflowApi';

export type LabTab =
  | 'dashboard'
  | 'orders'
  | 'samples'
  | 'results'
  | 'reports'
  | 'test-catalog'
  | 'workflows'
  | 'qc-equipment'
  | 'analytics'
  | 'lab-store'
  | 'lab-manager'
  | 'audit-log';

const LAB_TAB_LABELS: Record<LabTab, string> = {
  'dashboard': 'Dashboard',
  'orders': 'Orders',
  'samples': 'Samples',
  'results': 'Results',
  'reports': 'Reports',
  'test-catalog': 'Test Catalog',
  'workflows': 'Workflows',
  'qc-equipment': 'QC & Equipment',
  'analytics': 'Analytics',
  'lab-store': 'Lab Store',
  'lab-manager': 'Lab Manager',
  'audit-log': 'Audit Log',
};

const LAB_SUBNAV_SECTIONS: SubNavSection[] = [
  {
    id: 'laboratory',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { id: 'orders', label: 'Orders', icon: <ClipboardList size={16} /> },
      { id: 'samples', label: 'Samples', icon: <TestTube size={16} /> },
      { id: 'results', label: 'Results', icon: <FileCheck size={16} /> },
      { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
      { id: 'test-catalog', label: 'Test Catalog', icon: <BookOpen size={16} /> },
      { id: 'workflows', label: 'Workflows', icon: <GitBranch size={16} /> },
      { id: 'qc-equipment', label: 'QC & Equipment', icon: <Sliders size={16} /> },
      { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
      { id: 'lab-store', label: 'Lab Store', icon: <Store size={16} /> },
      { id: 'lab-manager', label: 'Lab Manager', icon: <Shield size={16} /> },
      { id: 'audit-log', label: 'Audit Log', icon: <History size={16} /> },
    ],
  },
];

export const LabScreen: React.FC = () => {
  const [activeLabTab, setActiveLabTab] = React.useState<LabTab>('samples');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = React.useState(false);
  const [orderAction, setOrderAction] = React.useState<{ mode: 'sample' | 'result'; orderId: string } | null>(null);

  const {
    orders,
    samples,
    results,
    reports,
    catalog: testCatalog,
    stock,
    qcData,
    users,
    auditLogs,
    isLoading,
    isError,
    error,
    refetch,
    createOrder,
    updateOrderStatus,
    updateSampleStatus,
    createReport,
    finalizeReport,
    amendReport,
    forwardReport,
    isCreatingOrder,
    createCatalogEntry,
    createQcEquipment,
    createQcRecord,
    isCreatingCatalogEntry,
    isCreatingQcEquipment,
    isCreatingQcRecord,
    collectSample,
    enterResult,
    isCollectingSample,
    isEnteringResult,
  } = useLab();

  const { customers } = useCustomers();
  const traceSampleId = useLabStore((s) => s.traceSampleId);
  const setTraceSampleId = useLabStore((s) => s.setTraceSampleId);
  const [workflowTestEntry, setWorkflowTestEntry] = React.useState<TestCatalogEntry | null>(null);
  const [initialWorkflowJson, setInitialWorkflowJson] = React.useState<string | undefined>(undefined);

  const handleAddOrder = React.useCallback(
    async (customerId: string, testCatalogId: string) => {
      await createOrder(customerId, testCatalogId);
    },
    [createOrder]
  );

  const handleUpdateOrderStatus = React.useCallback(
    async (orderId: string, newStatus: LabOrderStatus) => {
      await updateOrderStatus(orderId, newStatus);
    },
    [updateOrderStatus]
  );

  const handleUpdateSampleStatus = React.useCallback(
    async (sampleId: string, newStatus: LabSampleStatus) => {
      await updateSampleStatus(sampleId, newStatus);
    },
    [updateSampleStatus]
  );

  const selectedActionOrder = orderAction ? orders.find((order) => order.id === orderAction.orderId) || null : null;
  const selectedActionTest = selectedActionOrder ? testCatalog.find((test) => test.id === selectedActionOrder.test_catalog_id) : undefined;

  // Columns for Results view
  const resultColumns: ColumnDefinition<LabResult>[] = React.useMemo(
    () => [
      {
        key: 'test',
        header: 'Test',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
          return <span className="font-bold text-text">{test?.name || `Test record missing · ${order?.test_catalog_id || item.lab_order_id}`}</span>;
        },
      },
      {
        key: 'patient',
        header: 'Patient',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
          return <span className="font-medium text-text">{customer?.full_name || `Patient record missing · ${order?.customer_id || item.lab_order_id}`}</span>;
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
        header: 'Status',
        render: (item) =>
          item.is_out_of_range ? (
            <Badge variant="danger">Out of Range</Badge>
          ) : (
            <Badge variant="success">Normal</Badge>
          ),
      },
      {
        key: 'entered_by',
        header: 'Entered By',
        render: (item) => <span className="font-mono text-xs text-text-muted">{item.entered_by_user_id}</span>,
      },
    ],
    [orders, testCatalog, customers]
  );

  // Columns for Test Catalog view
  const catalogColumns: ColumnDefinition<TestCatalogEntry>[] = React.useMemo(
    () => [
      {
        key: 'name',
        header: 'Test Name',
        render: (item) => <span className="font-bold text-text">{item.name}</span>,
      },
      {
        key: 'category',
        header: 'Category',
        render: (item) => <span className="font-medium text-text-muted">{item.category}</span>,
      },
      {
        key: 'reference',
        header: 'Reference Range',
        render: (item) => <span className="font-mono text-xs text-text-muted">{item.reference_range || '—'}</span>,
      },
      {
        key: 'price',
        header: 'Price (TZS)',
        render: (item) => <span className="font-mono font-bold text-primary">{item.price.toLocaleString()} TZS</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: () => <Badge variant="success">Active</Badge>,
      },
      {
        key: 'workflow',
        header: 'Workflow',
        render: (item) => (
          <Button
            intent="neutral"
            size="sm"
            onClick={async () => {
              const wf = await labWorkflowApi.getWorkflowForTest(item.id);
              setInitialWorkflowJson(wf?.graph_json);
              setWorkflowTestEntry(item);
            }}
          >
            Configure Workflow
          </Button>
        ),
      },
    ],
    []
  );

  const renderContent = () => {
    switch (activeLabTab) {
      case 'dashboard':
        return (
          <LabDashboard
            orders={orders}
            samples={samples}
            results={results}
            testCatalog={testCatalog}
            customers={customers}
            onAddOrder={handleAddOrder}
            onViewOrder={(_orderId) => {
              setActiveLabTab('orders');
            }}
            loading={isLoading}
            error={isError ? (error as Error) : null}
            onRetry={refetch}
            isCreatingOrder={isCreatingOrder}
          />
        );

      case 'orders':
        return (
          <LabOrdersList
            orders={orders}
            testCatalog={testCatalog}
            customers={customers}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onCollectSample={(order) => setOrderAction({ mode: 'sample', orderId: order.id })}
            onEnterResult={(order) => setOrderAction({ mode: 'result', orderId: order.id })}
            loading={isLoading}
            error={isError ? (error as Error) : null}
            onRetry={refetch}
          />
        );

      case 'samples':
        return (
          <LabSamplesList
            samples={samples}
            orders={orders}
            customers={customers}
            testCatalog={testCatalog}
            onUpdateSampleStatus={handleUpdateSampleStatus}
            loading={isLoading}
            error={isError ? (error as Error) : null}
            onRetry={refetch}
          />
        );

      case 'results':
        return (
          <ResultsScreen
            results={results}
            orders={orders}
            customers={customers}
            testCatalog={testCatalog}
            samples={samples}
            loading={isLoading}
            error={isError ? (error as Error) : null}
            onRetry={refetch}
          />
        );

      case 'reports':
        return (
          <ReportsScreen
            reports={reports}
            orders={orders}
            customers={customers}
            results={results}
            testCatalog={testCatalog}
            samples={samples}
            users={users}
            onCreateReport={createReport}
            onFinalizeReport={finalizeReport}
            onAmendReport={amendReport}
            onForwardReport={forwardReport}
            loading={isLoading}
            error={isError ? (error as Error) : null}
            onRetry={refetch}
          />
        );

      case 'test-catalog':
        if (workflowTestEntry) {
          return (
            <div className="flex flex-col h-full w-full">
              <div className="flex items-center justify-between p-2 mb-2 bg-panel-strong/40 rounded-card">
                <span className="font-bold text-sm text-text">Workflow for: {workflowTestEntry.name}</span>
                <Button intent="neutral" size="sm" onClick={() => setWorkflowTestEntry(null)}>Back to Catalog</Button>
              </div>
              <div className="flex-1 min-h-[500px]">
                <WorkflowBuilder
                  testId={workflowTestEntry.id}
                  initialGraphJson={initialWorkflowJson}
                  onPublish={async (json) => {
                    const draft = await labWorkflowApi.saveWorkflowDraft(workflowTestEntry.id, json);
                    await labWorkflowApi.publishWorkflow(draft.id);
                  }}
                  onSaveDraft={async (json) => {
                    await labWorkflowApi.saveWorkflowDraft(workflowTestEntry.id, json);
                  }}
                />
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-end"><Button type="button" intent="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsCatalogModalOpen(true)}>Add test</Button></div>
            <DataTable
              data={testCatalog}
              columns={catalogColumns}
              loading={isLoading}
              error={isError ? (error as Error) : null}
              onRetry={refetch}
              emptyMessage="No test catalog entries found."
            />
          </div>
        );

      case 'workflows':
        if (workflowTestEntry) {
          return (
            <div className="flex flex-col h-full w-full">
              <div className="flex items-center justify-between p-2 mb-2 bg-panel-strong/40 rounded-card">
                <span className="font-bold text-sm text-text">Workflow for: {workflowTestEntry.name}</span>
                <Button intent="neutral" size="sm" onClick={() => setWorkflowTestEntry(null)}>Back to Workflows</Button>
              </div>
              <div className="flex-1 min-h-[500px]">
                <WorkflowBuilder
                  testId={workflowTestEntry.id}
                  initialGraphJson={initialWorkflowJson}
                  onPublish={async (json) => {
                    const draft = await labWorkflowApi.saveWorkflowDraft(workflowTestEntry.id, json);
                    await labWorkflowApi.publishWorkflow(draft.id);
                  }}
                  onSaveDraft={async (json) => {
                    await labWorkflowApi.saveWorkflowDraft(workflowTestEntry.id, json);
                  }}
                />
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-text">Test Step Workflows</h3>
                <p className="text-xs text-text-muted">Manage deterministic state machine step flows for each test in the catalog.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testCatalog.map((test) => (
                <div key={test.id} className="p-4 bg-panel rounded-card border border-border flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-text">{test.name}</h4>
                    <span className="text-xs text-text-muted font-mono">{test.category}</span>
                  </div>
                  <Button
                    intent="primary"
                    size="sm"
                    leftIcon={<GitBranch size={14} />}
                    onClick={async () => {
                      const wf = await labWorkflowApi.getWorkflowForTest(test.id);
                      setInitialWorkflowJson(wf?.graph_json);
                      setWorkflowTestEntry(test);
                    }}
                  >
                    Configure Workflow
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'qc-equipment':
        return (
          <LabQcPanel data={qcData} loading={isCreatingQcEquipment || isCreatingQcRecord} onAddEquipment={createQcEquipment} onRecord={createQcRecord} error={isError ? (error as Error)?.message || 'Unable to load laboratory data.' : null} onRetry={refetch} />
        );

      case 'analytics':
        {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <KPITile title="Total Requisitions" value={orders.length} tone="default" icon={<Activity size={18} />} subtext="Current period total" />
            <KPITile title="Turnaround SLA" value="—" tone="default" icon={<Clock size={18} />} subtext="Configure a branch SLA to calculate performance" />
            <KPITile title="Critical Out-Of-Range" value={results.filter(r => r.is_out_of_range).length} tone="danger" icon={<AlertTriangle size={18} />} subtext="Flagged for review" />
            <KPITile title="Recorded lab revenue" value="—" tone="default" icon={<Activity size={18} />} subtext="No linked realized-revenue source is available" />
          </div>
        );
        }

      case 'lab-store':
        {
          const lowStockCount = stock.filter((item) => item.quantity <= item.low_stock_threshold).length;
          const expiredCount = stock.filter((item) => new Date(item.expiry_date) < new Date()).length;
        return (
          <section className="flex flex-col gap-4 w-full">
            {isError && <div role="alert" className="flex items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger"><span>{(error as Error)?.message || 'Unable to load laboratory stock.'}</span><Button type="button" intent="neutral" onClick={refetch}>Retry</Button></div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><KPITile title="Stock batches" value={stock.length} tone="default" icon={<Store size={18} />} /><KPITile title="At or below reorder level" value={lowStockCount} tone={lowStockCount ? 'danger' : 'primary'} icon={<AlertTriangle size={18} />} /><KPITile title="Expired batches" value={expiredCount} tone={expiredCount ? 'danger' : 'default'} icon={<Clock size={18} />} /></div>
            <div className="rounded-card border border-border/50 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-panel-strong/40 text-left text-xs text-text-muted"><tr><th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">Batch</th><th className="p-3">Quantity</th><th className="p-3">Reorder at</th><th className="p-3">Expiry</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-border/50">{stock.map((item) => { const expired = new Date(item.expiry_date) < new Date(); const low = item.quantity <= item.low_stock_threshold; return <tr key={item.id}><td className="p-3 font-medium">{item.medicine.name}</td><td className="p-3">{item.medicine.category}</td><td className="p-3 font-mono">{item.batch_number}</td><td className="p-3">{item.quantity} {item.medicine.unit}</td><td className="p-3">{item.low_stock_threshold}</td><td className="p-3">{new Date(item.expiry_date).toLocaleDateString()}</td><td className="p-3"><Badge variant={expired || low ? 'danger' : 'success'}>{expired ? 'Expired' : low ? 'Reorder' : 'Available'}</Badge></td></tr>; })}</tbody></table>{stock.length === 0 && <p className="p-5 text-sm text-text-muted">No inventory batches are recorded for this branch.</p>}</div>
            <p className="text-xs text-text-muted">Quantities are read from this branch’s inventory batches. Replenishment and adjustments are managed in Inventory.</p>
          </section>
        );
        }

      case 'lab-manager':
        return (
          <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-2">
              {users.map((user) => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-panel rounded-card border border-border/40 text-xs">
                  <div className="flex items-center gap-3">
                    <UserIcon size={16} className="text-primary" />
                    <div>
                      <p className="font-bold text-text">{user.full_name}</p>
                      <p className="text-[10px] text-text-muted font-mono">Role: {user.role.toUpperCase()}</p>
                    </div>
                  </div>
                  <Badge variant={user.active ? 'success' : 'neutral'}>
                    {user.active ? 'Active Staff' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case 'audit-log':
        return (
          <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-2 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-panel rounded-card border border-border/40 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-text">{log.action}</p>
                    <p className="text-[10px] text-text-muted font-mono">Entity: {log.target_entity_type} ({log.target_entity_id})</p>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">{formatDateTime(log.created_at) || 'Invalid date'}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default: {
        const label = LAB_TAB_LABELS[activeLabTab] || activeLabTab;
        return (
          <div className="flex items-center justify-center p-12 text-text-muted">
            <p className="text-xl font-heading font-medium italic opacity-60">
              {label} — shell ready
            </p>
          </div>
        );
      }
    }
  };

  return (
    <TabContainer
      toolbar={
        <PageToolbar
          right={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                intent="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setIsModalOpen(true)}
              >
                New Requisition
              </Button>
              <IconButton
                icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
                label="Refresh laboratory data"
                intent="ghost"
                size="sm"
                onClick={() => refetch()}
              />
            </div>
          }
        />
      }
      overlays={
        <>
        <NewLabOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddOrder}
          customers={customers}
          testCatalog={testCatalog}
          isLoading={isCreatingOrder}
        />
        <NewTestCatalogModal isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)} onSubmit={createCatalogEntry} isLoading={isCreatingCatalogEntry} />
        <LabOrderActionModal mode={orderAction?.mode || null} order={selectedActionOrder} testName={selectedActionTest?.name || 'Laboratory test'} loading={isCollectingSample || isEnteringResult} onClose={() => setOrderAction(null)} onCollectSample={collectSample} onEnterResult={enterResult} />
        </>
      }
    >
      <div className="flex w-full h-full min-h-0 min-w-0 overflow-hidden">
        <ContextualSidebar
          storageKey="lab"
          sections={LAB_SUBNAV_SECTIONS}
          activeItemId={activeLabTab}
          onSelect={(id) => setActiveLabTab(id as LabTab)}
        />
        <div className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto custom-scrollbar pl-4 pr-3 pt-3">
          {traceSampleId ? (
            <TraceView
              sampleId={traceSampleId}
              samples={samples}
              orders={orders}
              customers={customers}
              results={results}
              reports={reports}
              reportForwards={[]}
              catalog={testCatalog}
              qcData={qcData}
              onBack={() => setTraceSampleId(null)}
              onOpenResult={() => {
                setTraceSampleId(null);
                setActiveLabTab('results');
              }}
              onOpenReport={() => {
                setTraceSampleId(null);
                setActiveLabTab('reports');
              }}
              onRecollect={(ordId) => {
                setTraceSampleId(null);
                setOrderAction({ mode: 'sample', orderId: ordId });
              }}
            />
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </TabContainer>
  );
};
