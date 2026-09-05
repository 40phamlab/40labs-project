import React, { useState } from 'react';
import { Settings, Pill, Package, Edit, Plus, Eye, EyeOff, Search, AlertTriangle, CheckCircle } from 'lucide-react';
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
  EntitySummaryPanel,
  Numpad,
  ReceiptPreview,
  Timeline,
  UnitPackSelector,
  SplitPaymentManager,
  HotkeyBadge,
  HotkeyModal,
  PriceDisplay,
  DiscountDisplay,
  QuantityControl,
  ProductRow,
  ProductResult,
  ProductSearch,
  CartSummary,
  Cart,
  CustomerSelector,
  CustomerSummary,
  OrderStatus,
  OrderSummary,
  PaymentSummary,
  PaymentMethodSelector,
} from '@40labs/ui-components';

export function ComponentLab() {
  const [searchValue, setSearchValue] = useState('');
  const [autoValue, setAutoValue] = useState('');
  const [comboValue, setComboValue] = useState<string | number>('');
  const [toggleVal, setToggleVal] = useState(true);
  const [switchVal, setSwitchVal] = useState(false);
  const [numpadValue, setNumpadValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('Strip');
  const [isHotkeyModalOpen, setIsHotkeyModalOpen] = useState(false);

  // Commerce Phase 7 States
  const [prodSearch, setProdSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [qty, setQty] = useState(1);

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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === '?') {
        setIsHotkeyModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { category: 'General', description: 'Show Shortcuts', keys: ['SHIFT', '?'] },
    { category: 'General', description: 'Cancel / Close', keys: ['ESC'] },
    { category: 'Sales', description: 'Focus Search', keys: ['F1'] },
    { category: 'Sales', description: 'Complete Sale', keys: ['CTRL', 'ENTER'] },
    { category: 'Sales', description: 'Add New Customer', keys: ['ALT', 'N'] },
  ];

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
              <IconButton icon={<Settings size={16} />} label="Settings" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Badges & Status</CardHeader>
            <CardBody className="flex flex-wrap gap-4 items-center">
              <Badge variant="primary">Badge</Badge>
              <StatusBadge status="active" />
              <div className="flex gap-1 items-center ml-4">
                <span className="text-[10px] text-text-muted mr-1">Hotkeys:</span>
                <HotkeyBadge>CTRL</HotkeyBadge>
                <HotkeyBadge>S</HotkeyBadge>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 2. FORMS */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">2. Forms & Controls</h2>
        <Card>
          <CardBody className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Field>
                <FieldLabel required>Standard Input</FieldLabel>
                <Input placeholder="Enter text..." />
                <FieldHint>Used for basic text entry.</FieldHint>
              </Field>
              <Field>
                <FieldLabel>Search & Password</FieldLabel>
                <div className="space-y-2">
                  <SearchInput placeholder="Search..." />
                  <PasswordInput placeholder="Password..." />
                </div>
              </Field>
              <Field>
                <FieldLabel>Specialized Numeric</FieldLabel>
                <div className="space-y-2">
                  <CurrencyInput placeholder="Amount (TZS)" />
                  <NumberInput placeholder="Quantity" />
                </div>
              </Field>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Field>
                <FieldLabel>Select & Phone</FieldLabel>
                <div className="space-y-2">
                  <Select>
                    <option>Select Option...</option>
                    <option>Pharmacy</option>
                    <option>Warehouse</option>
                  </Select>
                  <PhoneInput placeholder="Phone Number" />
                </div>
              </Field>
              <Field>
                <FieldLabel>Textarea & Date</FieldLabel>
                <div className="space-y-2">
                  <Textarea placeholder="Long notes..." rows={3} />
                  <DateInput />
                </div>
              </Field>
              <Field>
                <FieldLabel>Numpad Interface</FieldLabel>
                <div className="space-y-4">
                  <Input value={numpadValue} readOnly className="text-right font-mono text-lg" />
                  <Numpad value={numpadValue} onChange={setNumpadValue} onConfirm={() => addToast(`Confirmed: ${numpadValue}`)} />
                </div>
              </Field>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Field>
                <FieldLabel>Switches & Toggles</FieldLabel>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox id="c1" />
                      <label htmlFor="c1" className="text-xs">Checkbox</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio id="r1" name="demo" />
                      <label htmlFor="r1" className="text-xs">Radio</label>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch />
                      <span className="text-xs">Switch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle />
                      <span className="text-xs">Toggle</span>
                    </div>
                  </div>
                </div>
              </Field>
            </div>
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
          <Card>
            <CardHeader>Lists & Tables</CardHeader>
            <CardBody className="space-y-6">
              <DataTable
                data={mockData.slice(0, 3)}
                columns={columns.slice(0, 3)}
              />
              <List>
                <ListItem icon={<Pill size={16} />} action={<Button size="sm" intent="ghost">Edit</Button>}>
                  Paracetamol 500mg - 120 units in stock
                </ListItem>
                <ListItem icon={<Package size={16} />} action={<Badge variant="primary">Synced</Badge>}>
                  Inventory Sync Completed
                </ListItem>
              </List>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Metric label="Daily Sales" value="TZS 2,450,000" trend={{value: 12, isUp: true}} />
            <KPITile label="Total Orders" value="142" tone="primary" />
            <Panel variant="raised" className="p-4 flex flex-col justify-center items-center">
              <p className="text-caption text-text-muted uppercase mb-2">Panel Utility</p>
              <div className="flex items-center gap-3">
                <NotificationIndicator count={5} />
                <span className="text-xs">New Notifications</span>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* 5. FEEDBACK & OVERLAYS */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">5. Feedback & Overlays</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>States (Loading, Empty, Error)</CardHeader>
            <CardBody className="space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Loading State</p>
                <LoadingState message="Fetching Inventory..." />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Empty State</p>
                <EmptyState
                  title="No Orders Found"
                  message="We couldn't find any orders matching your criteria."
                  action={<Button size="sm" intent="secondary">Clear Filters</Button>}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Error State</p>
                <ErrorState onRetry={() => alert('Retrying...')} />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Success State</p>
                <SuccessState
                  title="Sale Confirmed"
                  message="The transaction has been recorded and receipt sent."
                  action={<Button size="sm">Print Receipt</Button>}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Loaders & Skeletons</CardHeader>
            <CardBody className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <Spinner size="sm" />
                  <p className="text-[9px] mt-2 text-text-muted">Small</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" />
                  <p className="text-[9px] mt-2 text-text-muted">Medium</p>
                </div>
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="text-[9px] mt-2 text-text-muted">Large</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Skeleton UI</p>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Table Skeleton</p>
                <div className="border border-border rounded-card overflow-hidden">
                  <SkeletonTable rows={3} columns={3} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

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
              <span className="text-xs underline cursor-help flex items-center gap-1">
                <Settings size={12} /> Tooltip Trigger
              </span>
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
            <div className="h-48 flex items-center justify-center border border-dashed border-border/30 rounded-card">
              <span className="text-text-muted text-xs italic">Chart Area</span>
            </div>
          </ChartPanel>
        </div>
      </section>

      {/* 7. COMMERCE & SALES (PHASE 7) */}
      <section className="space-y-6 pb-10">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">7. Commerce & Sales (Phase 7)</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Discovery & Controls */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Discovery & Search</h3>
              <ProductSearch
                value={prodSearch}
                onChange={setProdSearch}
                results={prodSearch.length > 0 && (
                  <>
                    <ProductResult name="Panadol Advance 500mg" subtitle="Paracetamol • 20 Tabs" price="TZS 2,500" />
                    <ProductResult name="Amoxicillin 250mg" subtitle="Antibiotic • 10 Caps" price="TZS 8,000" highlight />
                  </>
                )}
              />
              <div className="space-y-2">
                <ProductRow name="Metformin 500mg" sku="MET-500" stock={120} price="TZS 15,000" onAdd={() => {}} />
                <ProductRow name="Ibuprofen 400mg" sku="IBU-400" stock={85} price="TZS 2,200" onAdd={() => {}} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Pricing & Quantity</h3>
              <div className="flex flex-wrap gap-4 items-end bg-panel-strong/30 p-4 rounded-card border border-border/10">
                <PriceDisplay amount="120,000" originalAmount="150,000" size="lg" />
                <DiscountDisplay percentage={20} amount="30,000" label="Member Discount" />
                <QuantityControl value={qty} onIncrement={() => setQty(qty + 1)} onDecrement={() => setQty(Math.max(0, qty - 1))} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Product Card Variants</h3>
              <ProductCard
                name="Paracetamol 500mg"
                subtitle="Analgesic"
                stock={120}
                price="TZS 5,000"
                info="Batch: AB123"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Column 2: Cart & Payments */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Active Cart</h3>
              <Cart className="max-h-64 border border-border/20 shadow-xl">
                <CartItem
                  name="Panadol Advance 500mg"
                  unitPrice="2,500"
                  quantity={2}
                  subtotal="5,000"
                  onRemove={() => {}}
                />
                <CartItem
                  name="Amoxicillin 250mg"
                  unitPrice="8,000"
                  quantity={1}
                  subtotal="8,000"
                  onRemove={() => {}}
                />
              </Cart>
              <CartSummary
                subtotal="13,000"
                tax="2,340"
                discount="500"
                total="14,840"
                onCheckout={() => addToast('Processing...', 'info')}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Payment Flow</h3>
              <PaymentMethodSelector selectedMethod={payMethod} onSelect={setPayMethod} />
              <PaymentSummary
                payments={[
                  { method: 'Cash', amount: 'TZS 10,000', reference: 'CASH-882' },
                  { method: 'Mobile Money', amount: 'TZS 4,840', reference: 'M-PESA: QWE123RTY' }
                ]}
                totalPaid="TZS 14,840"
              />
            </div>
          </div>

          {/* Column 3: CRM & Order Context */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Customer Selection</h3>
              <CustomerSelector
                searchQuery={custSearch}
                onSearchChange={setCustSearch}
                results={[
                  { id: '1', full_name: 'John Doe', phone: '0712 345 678' },
                  { id: '2', full_name: 'Jane Smith', phone: '0655 111 222' }
                ]}
                selectedCustomer={selectedCust}
                onSelect={setSelectedCust}
                onClearSelection={() => setSelectedCust(null)}
                onWalkIn={() => addToast('Switched to Walk-in', 'neutral')}
              />
              <CustomerSummary customer={selectedCust} />
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Order Summary</h3>
              <OrderSummary
                orderNumber="ORD-2023-9981"
                date="2023-10-27 14:30"
                status="completed"
                itemCount={3}
                total="TZS 14,840"
              />
              <div className="flex flex-wrap gap-2">
                <OrderStatus status="pending" />
                <OrderStatus status="completed" />
                <OrderStatus status="processing" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Thermal Receipt</h3>
              <ReceiptPreview
                businessName="40LABS PHARMACY"
                businessAddress="123 Health St, Dar es Salaam, TZ"
                businessPhone="+255 700 000 000"
                orderId="ORD-2023-9981"
                date="2023-10-27 14:30"
                items={[
                  { name: 'Panadol Advance 500mg', qty: 2, price: 5000, total: 10000 },
                  { name: 'Amoxicillin 250mg', qty: 1, price: 12000, total: 12000 },
                ]}
                subtotal={22000}
                tax={3960}
                total={25960}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. TRACKING & HISTORY */}
      <section className="space-y-6 pb-32">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">8. Tracking & History</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>Prescription Lifecycle</CardHeader>
            <CardBody>
              <Timeline
                items={[
                  {
                    id: 1,
                    title: 'Prescription Issued',
                    timestamp: '2023-10-27 09:00',
                    description: 'Dr. Jane Smith issued electronic prescription for Amoxicillin.',
                    status: 'completed',
                    actor: 'System / Dr. Smith'
                  },
                  {
                    id: 2,
                    title: 'Dispensing Started',
                    timestamp: '2023-10-27 10:15',
                    description: 'Pharmacist has acknowledged and started picking the items.',
                    status: 'completed',
                    actor: 'Pharmacist Alex'
                  },
                  {
                    id: 3,
                    title: 'Quality Check',
                    timestamp: '2023-10-27 10:45',
                    description: 'Second-level batch verification and expiry validation.',
                    status: 'pending',
                    actor: 'Verification Bot'
                  },
                  {
                    id: 4,
                    title: 'Ready for Collection',
                    timestamp: '--:--',
                    description: 'Waiting for customer notification to be triggered.',
                    status: 'future'
                  }
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Stock Movement Log</CardHeader>
            <CardBody>
              <Timeline
                items={[
                  {
                    id: 101,
                    title: 'Batch Received',
                    timestamp: '2023-10-20',
                    description: 'GRN-9982: 500 units of Paracetamol received into main store.',
                    status: 'completed',
                    actor: 'Store Mgr'
                  },
                  {
                    id: 102,
                    title: 'Batch Quarantined',
                    timestamp: '2023-10-21',
                    description: 'Temperature deviation reported during storage. Audit required.',
                    status: 'error',
                    actor: 'Sensor-Node-04'
                  },
                  {
                    id: 103,
                    title: 'Re-inspection Requested',
                    timestamp: '2023-10-22',
                    description: 'Manual inspection of samples to verify chemical integrity.',
                    status: 'warning',
                    actor: 'QA Officer'
                  }
                ]}
              />
            </CardBody>
          </Card>
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

      <HotkeyModal
        isOpen={isHotkeyModalOpen}
        onClose={() => setIsHotkeyModalOpen(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}
