import * as React from 'react';
import {
  PageViewport,
  PageHeader,
  PageContent,
  ContextualSubNav,
  SubNavSection,
  DataTable,
  ColumnDefinition,
  Badge,
  KPITile,
} from '@40labs/ui-components';
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
  DollarSign,
} from 'lucide-react';
import type { LabResult, TestCatalogEntry, Customer, LabOrderStatus, LabSampleStatus } from '@40labs/types';
import { LabDashboard } from './components/LabDashboard';
import { LabOrdersList } from './components/LabOrdersList';
import { LabSamplesList } from './components/LabSamplesList';
import { useLab } from '../../hooks/useLab';
import { useCustomers } from '../../hooks/useCustomers';

export type LabTab =
  | 'dashboard'
  | 'orders'
  | 'samples'
  | 'results'
  | 'test-catalog'
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
  'test-catalog': 'Test Catalog',
  'qc-equipment': 'QC & Equipment',
  'analytics': 'Analytics',
  'lab-store': 'Lab Store',
  'lab-manager': 'Lab Manager',
  'audit-log': 'Audit Log',
};

const LAB_SUBNAV_SECTIONS: SubNavSection[] = [
  {
    id: 'laboratory',
    title: 'Laboratory',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { id: 'orders', label: 'Orders', icon: <ClipboardList size={16} /> },
      { id: 'samples', label: 'Samples', icon: <TestTube size={16} /> },
      { id: 'results', label: 'Results', icon: <FileCheck size={16} /> },
      { id: 'test-catalog', label: 'Test Catalog', icon: <BookOpen size={16} /> },
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

  const {
    orders,
    samples,
    results,
    catalog: testCatalog,
    users,
    auditLogs,
    createOrder,
    updateOrderStatus,
    updateSampleStatus,
  } = useLab();

  const { customers } = useCustomers();

  const handleAddOrder = React.useCallback(
    async (newOrder: { customer_id: string; test_catalog_id: string }, _newCustomer?: Customer) => {
      await createOrder(newOrder.customer_id, newOrder.test_catalog_id);
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

  // Columns for Results view
  const resultColumns: ColumnDefinition<LabResult>[] = React.useMemo(
    () => [
      {
        key: 'test',
        header: 'Test',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
          return <span className="font-bold text-text">{test?.name || 'Lab Test'}</span>;
        },
      },
      {
        key: 'patient',
        header: 'Patient',
        render: (item) => {
          const order = orders.find((o) => o.id === item.lab_order_id);
          const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
          return <span className="font-medium text-text">{customer?.full_name || 'Guest Patient'}</span>;
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
          />
        );

      case 'orders':
        return (
          <LabOrdersList
            orders={orders}
            testCatalog={testCatalog}
            customers={customers}
            onUpdateOrderStatus={handleUpdateOrderStatus}
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
          />
        );

      case 'results':
        return (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h2 className="text-base font-bold text-text">Laboratory Results</h2>
              <p className="text-xs text-text-muted">Review, verify, and override diagnostic test findings.</p>
            </div>
            <div className="w-full">
              <DataTable data={results} columns={resultColumns} emptyMessage="No laboratory results recorded." />
            </div>
          </div>
        );

      case 'test-catalog':
        return (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h2 className="text-base font-bold text-text">Diagnostic Test Catalog</h2>
              <p className="text-xs text-text-muted">Manage available laboratory tests, categories, and TZS pricing.</p>
            </div>
            <div className="w-full">
              <DataTable data={testCatalog} columns={catalogColumns} emptyMessage="No test catalog entries found." />
            </div>
          </div>
        );

      case 'qc-equipment':
        return (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h2 className="text-base font-bold text-text">Quality Control & Equipment</h2>
              <p className="text-xs text-text-muted">Monitor instrument calibration, daily control logs, and status.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text text-sm">Sysmex XN-350 Hematology Analyzer</span>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="text-xs text-text-muted flex flex-col gap-1">
                  <p>Last Calibrated: 2 days ago</p>
                  <p>QC Control Pass Rate: <span className="font-bold text-primary">100%</span></p>
                  <p>Status: Ready for CBC & Blood Profiles</p>
                </div>
              </div>

              <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text text-sm">Reflotron Plus Biochemistry System</span>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="text-xs text-text-muted flex flex-col gap-1">
                  <p>Last Calibrated: 1 day ago</p>
                  <p>QC Control Pass Rate: <span className="font-bold text-primary">98.5%</span></p>
                  <p>Status: Calibration verified for Glucose & Lipid panels</p>
                </div>
              </div>

              <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text text-sm">Biorad Microplate Reader</span>
                  <Badge variant="primary">Standby</Badge>
                </div>
                <div className="text-xs text-text-muted flex flex-col gap-1">
                  <p>Last Calibrated: 5 days ago</p>
                  <p>QC Control Pass Rate: <span className="font-bold text-primary">100%</span></p>
                  <p>Status: Standby for Serology EIA runs</p>
                </div>
              </div>

              <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text text-sm">Binocular Microscope CX23</span>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="text-xs text-text-muted flex flex-col gap-1">
                  <p>Last Cleaned & Serviced: 7 days ago</p>
                  <p>Light Source: LED (100% Life)</p>
                  <p>Status: Active for Stool & Parasitology slides</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h2 className="text-base font-bold text-text">Laboratory Analytics & Turnaround</h2>
              <p className="text-xs text-text-muted">Key performance indicators, SLA compliance, and test volume breakdown.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <KPITile title="Total Requisitions" value={orders.length} tone="default" icon={<Activity size={18} />} subtext="Current period total" />
              <KPITile title="TAT SLA Compliance" value="98.2%" tone="primary" icon={<Clock size={18} />} subtext="Under 24h turnaround" />
              <KPITile title="Critical Out-Of-Range" value={results.filter(r => r.is_out_of_range).length} tone="danger" icon={<AlertTriangle size={18} />} subtext="Flagged for review" />
              <KPITile title="Estimated Revenue" value="1,450,000 TZS" tone="primary" icon={<DollarSign size={18} />} subtext="Lab test earnings" />
            </div>
          </div>
        );

      case 'lab-store':
        return (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h2 className="text-base font-bold text-text">Lab Store & Reagent Stock</h2>
              <p className="text-xs text-text-muted">Track diagnostic kits, buffer solutions, slides, and blood collection tubes.</p>
            </div>
            <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3 w-full">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-panel rounded-card border border-border/40">
                  <p className="text-text-muted font-bold uppercase text-[10px]">EDTA Blood Tubes</p>
                  <p className="text-lg font-bold text-primary">500 units</p>
                  <p className="text-[10px] text-text-muted">Stock Level: Good</p>
                </div>
                <div className="p-3 bg-panel rounded-card border border-border/40">
                  <p className="text-text-muted font-bold uppercase text-[10px]">Malaria RDT Cassettes</p>
                  <p className="text-lg font-bold text-accent">120 units</p>
                  <p className="text-[10px] text-text-muted">Stock Level: Reorder Soon</p>
                </div>
                <div className="p-3 bg-panel rounded-card border border-border/40">
                  <p className="text-text-muted font-bold uppercase text-[10px]">Glucose Test Strips</p>
                  <p className="text-lg font-bold text-primary">250 strips</p>
                  <p className="text-[10px] text-text-muted">Stock Level: Good</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'lab-manager':
        return (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h2 className="text-base font-bold text-text">Lab Manager & Authorizations</h2>
              <p className="text-xs text-text-muted">Staff permissions, result override authorizations, and supervisor settings.</p>
            </div>
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
          </div>
        );

      case 'audit-log':
        return (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h2 className="text-base font-bold text-text">Laboratory Audit Trail</h2>
              <p className="text-xs text-text-muted">Immutable log of specimen updates, critical overrides, and user actions.</p>
            </div>
            <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3 w-full">
              <div className="flex flex-col gap-2 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-panel rounded-card border border-border/40 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-text">{log.action}</p>
                      <p className="text-[10px] text-text-muted font-mono">Entity: {log.target_entity_type} ({log.target_entity_id})</p>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">{new Date(log.created_at).toLocaleString('en-GB')}</span>
                  </div>
                ))}
              </div>
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
    <PageViewport>
      <PageHeader
        title="Laboratory Management"
        subtitle="Diagnostic test catalog, sample requisitions, result entry, and quality control."
      />

      <PageContent scrollable={false} padding="normal">
        <div className="flex gap-6 w-full h-full overflow-hidden">
          {/* Left SubNav */}
          <div className="w-60 shrink-0 border-r border-border/40 pr-4 h-full overflow-y-auto custom-scrollbar">
            <ContextualSubNav
              sections={LAB_SUBNAV_SECTIONS}
              activeItemId={activeLabTab}
              onSelect={(id) => setActiveLabTab(id as LabTab)}
            />
          </div>

          {/* Main Content Pane */}
          <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar">
            {renderContent()}
          </div>
        </div>
      </PageContent>
    </PageViewport>
  );
};
