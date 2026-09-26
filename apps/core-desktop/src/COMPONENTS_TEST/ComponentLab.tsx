import React, { useState } from 'react';
import {
  Settings,
  Pill,
  Package,
  Plus,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  BarChart3,
  Bell,
  Database,
  ShieldCheck,
  CloudUpload,
  FileText,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  Activity,
  Microscope,
  Baby
} from 'lucide-react';
import {
  Button,
  IconButton,
  Badge,
  Separator,
  Card,
  CardHeader,
  CardBody,
  Panel,
  Spinner,
  Skeleton,
  Field,
  FieldLabel,
  FieldHint,
  Input,
  SearchInput,
  NumberInput,
  CurrencyInput,
  PhoneInput,
  PasswordInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Toggle,
  Switch,
  DateInput,
  Breadcrumbs,
  Tabs,
  Tab,
  SegmentedControl,
  Pagination,
  NotificationIndicator,
  DataTable,
  List,
  ListItem,
  Alert,
  Progress,
  Modal,
  Drawer,
  Tooltip,
  ToastContainer,
  DashboardShell,
  HotkeyBadge,
  HotkeyModal,
  AppSidebarNav,
  ContextualSubNav,
  DashboardHeaderBar,
  KPITile,
  EmptyState,
  LoadingState,
  StatusBadge,
} from '@40labs/ui-components';
import { Numpad } from '../features/sales/components/Numpad';
import { ReceiptPreview } from '../features/sales/components/ReceiptPreview';
import { CartItemRow, CartItemModel } from '../features/sales/components/CartItemRow';
import { CartSummaryPanel, CartSummaryPayload } from '../features/sales/components/CartSummaryPanel';
import { ProductRow } from '../features/sales/components/ProductRow';

export function ComponentLab() {
  const [toggleVal, setToggleVal] = useState(true);
  const [switchVal, setSwitchVal] = useState(false);
  const [numpadValue, setNumpadValue] = useState('');
  const [isHotkeyModalOpen, setIsHotkeyModalOpen] = useState(false);

  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [activeSubRoute, setActiveSubRoute] = useState('business');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSubNav, setShowSubNav] = useState(true);
  const [, setFullScreenMode] = useState(false);
  const [activePayload, setActivePayload] = useState<'pharmacy' | 'hospital'>('pharmacy');

  interface ToastItem {
    id: string;
    message: string;
    intent?: 'info' | 'success' | 'warning' | 'danger';
  }

  interface MockDataRow {
    id: number;
    name: string;
    stock: number;
    price: number;
    status: string;
    category: string;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, intent: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
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
  ];

  const mockData: MockDataRow[] = [
    { id: 1, name: 'Paracetamol 500mg', stock: 124, price: 5.50, status: 'active', category: 'Analgesics' },
    { id: 2, name: 'Amoxicillin 250mg', stock: 42, price: 12.00, status: 'warning', category: 'Antibiotics' },
  ];

  const columns = [
    { key: 'name', header: 'Product Name', sortable: true },
    { key: 'category', header: 'Category' },
    {
      key: 'stock',
      header: 'Stock',
      render: (item: MockDataRow) => <span>{item.stock} units</span>
    }
  ];

  const pharmacyConfig = {
    branding: {
      brandName: "40LABS",
      brandTagline: "PHARMACY",
      logo: <Pill size={18} />,
      themeColor: "var(--color-primary)"
    },
    user: {
      name: "Dr. Alex Z. (Pharmacist)",
      role: "Super Admin",
      permissions: ["can_sell", "can_manage_inventory", "can_view_reports", "can_manage_settings"]
    },
    navigation: [
      { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} />, route: '/dashboard' },
      { id: 'sales', label: 'Point of Sale', icon: <ShoppingBag size={20} />, route: '/pos', badgeCount: 3, permissionRequired: 'can_sell' },
      { id: 'inventory', label: 'Inventory', icon: <Pill size={20} />, route: '/stock', permissionRequired: 'can_manage_inventory' },
      { id: 'reports', label: 'Analytics', icon: <BarChart3 size={20} />, route: '/reports', permissionRequired: 'can_view_reports' },
    ],
    settingsSubNav: [
      {
        id: 'biz',
        title: 'Organization',
        items: [
          { id: 'business', label: 'Pharmacy Profile', icon: <Database size={16} /> },
          { id: 'users', label: 'Staff Management', icon: <Users size={16} />, badgeCount: 4 }
        ]
      },
      {
        id: 'sys',
        title: 'System',
        items: [
          { id: 'security', label: 'Security & Access', icon: <ShieldCheck size={16} /> },
          { id: 'backup', label: 'Data Backup', icon: <CloudUpload size={16} /> }
        ]
      }
    ],
    header: {
      indicators: [
        { id: 'i1', label: 'Status', value: 'Live', color: 'primary' as const, type: 'dot' as const },
        { id: 'i2', label: 'Orders', value: '142', icon: <ShoppingCart size={14} />, type: 'pill' as const }
      ]
    }
  };

  const hospitalConfig = {
    branding: {
      brandName: "AFYA BORA",
      brandTagline: "HOSPITAL",
      logo: <HeartPulse size={18} />,
      themeColor: "var(--color-danger)"
    },
    user: {
      name: "Nurse Jane Smith",
      role: "Ward Manager",
      permissions: ["can_view_patients", "can_manage_wards", "can_view_records"]
    },
    navigation: [
      { id: 'dashboard', label: 'Wards', icon: <Activity size={20} />, route: '/wards' },
      { id: 'patients', label: 'Patients', icon: <Users size={20} />, route: '/patients', badgeCount: 12, permissionRequired: 'can_view_patients' },
      { id: 'records', label: 'Medical Records', icon: <ClipboardList size={20} />, route: '/records', permissionRequired: 'can_view_records' },
      { id: 'labs', label: 'Lab Results', icon: <Microscope size={20} />, route: '/labs' },
      { id: 'pediatrics', label: 'Pediatrics', icon: <Baby size={20} />, route: '/peds' },
    ],
    settingsSubNav: [
      {
        id: 'hosp',
        title: 'Clinical Config',
        items: [
          { id: 'wards', label: 'Ward Assignment', icon: <Database size={16} /> },
          { id: 'staff', label: 'Doctor Roster', icon: <Stethoscope size={16} /> }
        ]
      },
      {
        id: 'adm',
        title: 'Admin',
        items: [
          { id: 'billing', label: 'Billing Rules', icon: <FileText size={16} /> },
          { id: 'compliance', label: 'HMO Compliance', icon: <ShieldCheck size={16} /> }
        ]
      }
    ],
    header: {
      indicators: [
        { id: 'h1', label: 'ER Load', value: 'High', color: 'danger' as const, type: 'pill' as const },
        { id: 'h2', label: 'Surgeries', value: '08', icon: <Activity size={14} />, type: 'pill' as const }
      ]
    }
  };

  const config = activePayload === 'pharmacy' ? pharmacyConfig : hospitalConfig;

  const mockCartItems: CartItemModel[] = [
    {
      id: 'item-1',
      name: 'Panadol Advance 500mg',
      unitPrice: 2500,
      quantity: 2,
      unitType: 'Strip',
      stockStatus: 'in-stock',
      discountAmount: 100,
      currencyCode: 'TZS'
    },
  ];

  const mockCartSummary: CartSummaryPayload = {
    subtotal: 13000,
    discounts: [{ label: 'Member Promo', amount: 500 }],
    taxes: [{ label: 'VAT', rate: 18, amount: 2250 }],
    grandTotal: 14750,
    currencyCode: 'TZS'
  };

  return (
    <div className="p-8 space-y-16 bg-surface min-h-screen text-text pb-32 overflow-y-auto h-full">
      <header className="border-b border-border/20 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">40Labs Component Lab</h1>
          <p className="text-text-muted mt-1">Component Isolation & Validation</p>
        </div>
        <div className="flex bg-panel-strong/30 p-1 rounded-input">
           <button
             onClick={() => setActivePayload('pharmacy')}
             className={`px-4 py-1.5 text-xs font-bold rounded-input transition-all ${activePayload === 'pharmacy' ? 'bg-primary text-surface elevation-raised' : 'text-text-muted'}`}
           >
             Pharmacy Tenant
           </button>
           <button
             onClick={() => setActivePayload('hospital')}
             className={`px-4 py-1.5 text-xs font-bold rounded-input transition-all ${activePayload === 'hospital' ? 'bg-danger text-surface elevation-raised' : 'text-text-muted'}`}
           >
             Hospital Admin
           </button>
        </div>
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
                      <Switch checked={switchVal} onChange={setSwitchVal} />
                      <span className="text-xs">Switch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle checked={toggleVal} onChange={setToggleVal} />
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
            <KPITile title="Total Orders" value="142" tone="primary" />
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
            <CardHeader>States (Loading, Empty)</CardHeader>
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

      {/* 7. COMMERCE & SALES */}
      <section className="space-y-6 pb-10">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">7. Sales Features</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <ProductRow name="Metformin 500mg" sku="MET-500" stock={120} price={15000} onAdd={() => {}} />
            {mockCartItems.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantityChange={(id, q) => console.log('Qty:', id, q)}
                onRemove={(id) => console.log('Remove:', id)}
              />
            ))}
          </div>

          <div className="space-y-4">
            <CartSummaryPanel
              payload={mockCartSummary}
              onConfirm={() => alert('Confirmed')}
              onClear={() => alert('Cleared')}
            />
            <ReceiptPreview
              businessName="40LABS PHARMACY"
              businessAddress="123 Health St, Dar es Salaam, TZ"
              businessPhone="+255 700 000 000"
              orderId="ORD-2023-9981"
              date="2023-10-27 14:30"
              items={[
                { name: 'Panadol Advance 500mg', qty: 2, price: 5000, total: 10000 },
              ]}
              subtotal={10000}
              tax={1800}
              total={11800}
            />
          </div>
        </div>
      </section>

      {/* 17. FULL APPLICATION LAYOUT INTEGRATION */}
      <section className="space-y-6 pb-64">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">17. Full Application Layout Integration</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 px-2">
             <Button size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
               Toggle Sidebar
             </Button>
             <Button size="sm" intent="neutral" onClick={() => setShowSubNav(!showSubNav)}>
               Toggle Sub-Nav
             </Button>
             <Button size="sm" intent="accent" onClick={() => setFullScreenMode(true)}>
               Enter Full-Screen Preview
             </Button>
          </div>

          <div className="h-[800px] border-4 border-panel-strong rounded-card overflow-hidden shadow-surface-pop bg-surface relative group">
             <DashboardShell
               showSubNav={showSubNav}
               sidebar={
                 <AppSidebarNav
                   activeRoute={activeRoute}
                   collapsed={sidebarCollapsed}
                   onNavigate={setActiveRoute}
                   onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                   tenantBranding={config.branding}
                   userProfile={config.user}
                   items={config.navigation}
                   pinnedBottomItems={[
                     { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
                   ]}
                 />
               }
               header={
                 <DashboardHeaderBar
                   moduleTitle={activeRoute.toUpperCase()}
                   statusIndicatorColor={activeRoute === 'hospital' ? 'red' : 'green'}
                   searchPlaceholder={activeRoute === 'hospital' ? "Find patient by ID..." : "Search product..."}
                   searchHotkeys={['CTRL', 'K']}
                   statusIndicators={config.header.indicators}
                   actionButtons={[
                     { id: 'n1', icon: <Bell size={18} />, onClick: () => alert('Notifications'), hasBadge: true, badgeColor: activeRoute === 'hospital' ? 'danger' : 'primary' }
                   ]}
                   onSearch={(q) => console.log('Global search:', q)}
                 />
               }
               subNav={
                 <ContextualSubNav
                   sections={config.settingsSubNav}
                   activeItemId={activeSubRoute}
                   onSelect={setActiveSubRoute}
                   userPermissions={config.user.permissions}
                 />
               }
             >
               <div className="space-y-8">
                 <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-heading font-bold text-text capitalize">{activeRoute} Management</h2>
                   <div className="flex gap-2">
                     <Button intent="secondary" size="sm" leftIcon={<Plus size={16} />}>Create New</Button>
                     <Button size="sm" leftIcon={<FileText size={16} />}>Export Report</Button>
                   </div>
                 </div>

                 <Card>
                   <CardHeader>Recent {activePayload === 'hospital' ? 'Patients' : 'Activity'}</CardHeader>
                   <CardBody>
                      <DataTable
                        data={mockData}
                        columns={columns}
                      />
                   </CardBody>
                 </Card>
               </div>
             </DashboardShell>
          </div>
        </div>
      </section>

      {/* OVERLAYS */}
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
