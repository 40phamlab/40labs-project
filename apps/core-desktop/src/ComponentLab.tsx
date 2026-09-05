import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Separator,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Panel,
  Spinner,
  Skeleton,
  Field,
  FieldLabel,
  FieldHint,
  FieldError,
  Input,
  SearchInput,
  NumberInput,
  CurrencyInput,
  PhoneInput,
  PasswordInput,
  Textarea,
  Select,
  Combobox,
  Autocomplete,
  Checkbox,
  Radio,
  Toggle,
  Switch,
  DateInput,
  Sidebar,
  SidebarSection,
  SidebarItem,
  TopBar,
  Breadcrumbs,
  Tabs,
  Tab,
  SegmentedControl,
  Pagination,
  DropdownMenu,
  DropdownMenuItem,
  Menu,
  MenuItem,
  NotificationIndicator,
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableHeader,
  FilterBar,
  FilterChip,
  EmptyState,
  LoadingState,
  ErrorState,
  SuccessState,
  SkeletonTable,
  StatusBadge,
  KeyValue,
  Metric,
  KPITile,
  StatGroup,
  List,
  ListItem,
  Alert,
  InlineAlert,
  Progress,
  Modal,
  Drawer,
  ConfirmDialog,
  AlertDialog,
  Tooltip,
  Popover,
  ToastContainer,
  DashboardShell,
  DashboardHeader,
  DashboardToolbar,
  DashboardGrid,
  DashboardSection,
  DashboardCard,
  KPIGrid,
  KPICard,
  TrendIndicator,
  SummaryPanel,
  ActivityPanel,
  ChartPanel,
  ChartContainer,
  QuickActions,
  ProductCard,
  CartItem,
  InfoDetail,
  EntitySummaryPanel
} from '@40labs/ui-components';

export function ComponentLab() {
  const [searchValue, setSearchValue] = useState('');
  const [autoValue, setAutoValue] = useState('');
  const [comboValue, setComboValue] = useState<string | number>('');
  const [toggleVal, setToggleVal] = useState(true);
  const [switchVal, setSwitchVal] = useState(false);

  const [activeTab, setActiveTab] = useState('Overview');
  const [segValue, setSegValue] = useState('day');
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Phase 5 States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (message: string, intent: any = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, intent }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const mockItems = [
    { id: 1, name: 'Paracetamol' },
    { id: 2, name: 'Amoxicillin' },
    { id: 3, name: 'Ibuprofen' },
  ];

  const comboOptions = [
    { label: 'Pharmacy A', value: 'a' },
    { label: 'Pharmacy B', value: 'b' },
  ];

  const mockData = [
    { id: 1, name: 'Paracetamol 500mg', stock: 124, price: 5.50, status: 'active', category: 'Analgesics' },
    { id: 2, name: 'Amoxicillin 250mg', stock: 42, price: 12.00, status: 'warning', category: 'Antibiotics' },
    { id: 3, name: 'Ibuprofen 400mg', stock: 0, price: 8.25, status: 'error', category: 'Analgesics' },
  ];

  const columns = [
    { key: 'name', header: 'Product Name', sortable: true },
    { key: 'category', header: 'Category' },
    {
      key: 'stock',
      header: 'Stock',
      render: (item: any) => <span>{item.stock} units</span>
    }
  ];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="p-8 space-y-16 bg-surface min-h-screen text-text pb-32 overflow-y-auto h-full">
      <header className="border-b border-border/20 pb-4">
        <h1 className="text-3xl font-heading font-bold text-primary">40Labs Component Lab</h1>
        <p className="text-text-muted mt-1">Component Isolation & Validation</p>
      </header>

      {/* 1. PRIMITIVES */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">1. Primitives</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>Buttons & Icons</CardHeader>
            <CardBody className="flex flex-wrap gap-4">
              <Button intent="primary">Button</Button>
              <IconButton icon={<span>⚙</span>} label="Settings" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Badges & Status</CardHeader>
            <CardBody className="flex flex-wrap gap-4 items-center">
              <Badge variant="primary">Badge</Badge>
              <StatusBadge status="active" />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 2. FORMS */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">2. Forms</h2>
        <Card>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Field>
              <FieldLabel required>Input</FieldLabel>
              <Input placeholder="Standard Input" />
              <FieldHint>Standalone field components.</FieldHint>
            </Field>
            <SearchInput placeholder="Search Input" />
            <PasswordInput placeholder="Password Input" />
          </CardBody>
        </Card>
      </section>

      {/* 3. NAVIGATION */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">3. Navigation</h2>
        <div className="space-y-8">
          <Tabs>
            <Tab label="Tab 1" active />
            <Tab label="Tab 2" />
          </Tabs>
          <SegmentedControl
            options={[{label: 'Option A', value: 'a'}, {label: 'Option B', value: 'b'}]}
            value="a"
            onChange={() => {}}
          />
          <Breadcrumbs items={[{label: 'Home'}, {label: 'Library', active: true}]} />
          <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />
        </div>
      </section>

      {/* 4. DATA DISPLAY */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">4. Data Display</h2>
        <div className="space-y-8">
          <DataTable
            data={mockData.slice(0, 3)}
            columns={columns.slice(0, 3)}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Metric label="Independent Metric" value="1,234" trend={{value: 5, isUp: true}} />
            <KPITile label="Standalone KPI" value="$500" tone="primary" />
          </div>
        </div>
      </section>

      {/* 5. FEEDBACK & OVERLAYS */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">5. Feedback & Overlays</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Alert intent="info">Standalone Alert Component</Alert>
            <Progress value={45} showLabel />
          </div>
          <div className="flex flex-wrap gap-4 items-start">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Button onClick={() => setIsDrawerOpen(true)} intent="neutral">Open Drawer</Button>
            <Button onClick={() => addToast('Notification sent', 'info')} intent="ghost">Trigger Toast</Button>
            <Tooltip content="Tooltip content">
              <span className="text-xs underline cursor-help">Tooltip Trigger</span>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* 6. DASHBOARD COMPONENTS */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">6. Dashboard Components</h2>
        <KPIGrid>
          <KPICard title="Revenue" value="$12,000" trend={{value: 10, isUp: true}} tone="primary" />
          <KPICard title="Users" value="1,200" tone="accent" />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DashboardCard title="Quick Actions">
            <QuickActions>
              <Button size="sm" intent="secondary">Action 1</Button>
              <Button size="sm" intent="secondary">Action 2</Button>
            </QuickActions>
          </DashboardCard>
          <ChartPanel title="Standalone Chart Container">
            [Chart Area]
          </ChartPanel>
        </div>
      </section>

      {/* 7. COMMERCE COMPOSITES */}
      <section className="space-y-6 pb-20">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">7. Commerce Composites</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-accent italic underline decoration-accent/30">ProductCard Variants</h3>
            <ProductCard
              name="Paracetamol 500mg"
              subtitle="Analgesic"
              stock={120}
              price="TZS 5,000"
              info="Batch: AB123"
            />
            <ProductCard
              name="Amoxicillin 250mg"
              subtitle="Antibiotic"
              stock={45}
              price="TZS 12,000"
              info="Batch: XY987"
              onClick={() => alert('Clicked')}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-accent italic underline decoration-accent/30">CartItem Variants</h3>
            <CartItem
              name="Paracetamol 500mg"
              unitPrice="5,000"
              quantity={2}
              subtotal="10,000"
              onIncrement={() => {}}
              onDecrement={() => {}}
              onRemove={() => {}}
            />
            <CartItem
              name="Empty Image Product"
              unitPrice="1,000"
              quantity={1}
              subtotal="1,000"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-accent italic underline decoration-accent/30">Entity Summary</h3>
            <EntitySummaryPanel title="Customer Profile">
              <InfoDetail label="Full Name" value="John Doe" />
              <InfoDetail label="Phone" value="+255 123 456 789" monospace />
              <InfoDetail label="Outstanding Balance" value="TZS 50,000" monospace />
              <InfoDetail label="Last Visit" value="2023-10-27" />
            </EntitySummaryPanel>
          </div>
        </div>
      </section>

      {/* OVERLAYS (PORTALS) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Standalone Modal">
        <p>This modal stands by itself without internal component dependencies.</p>
        <div className="mt-8 flex justify-end">
           <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-panel rounded-input text-xs">Close</button>
        </div>
      </Modal>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Standalone Drawer">
        <p className="p-4 text-xs">Drawer content area.</p>
      </Drawer>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
