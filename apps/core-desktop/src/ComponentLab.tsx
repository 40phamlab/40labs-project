import React, { useState } from 'react';
import {
  Settings,
  Pill,
  Package,
  Edit,
  Plus,
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  CheckCircle,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  Globe,
  BarChart3,
  Calendar,
  GraduationCap,
  Bell,
  Database,
  ShieldCheck,
  CloudUpload,
  Layers,
  FileText,
  Truck,
  History,
  Download,
  Share2,
  MessageCircle,
  Mail,
  MessageSquare,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Monitor,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  Activity,
  Microscope,
  Baby,
  Dna
} from 'lucide-react';
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
  CartItemRow,
  CartSummaryPanel,
  OnboardingCarouselCard,
  AuthFormCard,
  TermsCheckboxGroup,
  LocationGpsGroup,
  AuthSuccessCard,
  ChannelConnectList,
  AppSidebarNav,
  ContextualSubNav,
  DashboardHeaderBar,
  QuickActionsGrid,
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
  const [activeStep, setActiveStep] = useState(0);

  const [activeTab, setActiveTab] = useState('Overview');
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [activeSubRoute, setActiveSubRoute] = useState('business');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSubNav, setShowSubNav] = useState(true);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [segValue, setSegValue] = useState('day');
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Payload Toggle for Layout Integration
  const [activePayload, setActivePayload] = useState<'pharmacy' | 'hospital'>('pharmacy');

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

  // --- API PAYLOAD MOCKS ---

  const pharmacyConfig = {
    branding: {
      brandName: "40LABS",
      brandTagline: "PHARMACY",
      logo: <Pill size={18} />,
      themeColor: "#39B54A"
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
      themeColor: "#EF4444"
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

  // --- FORM SCHEMAS ---

  const signInSchema: any = {
    id: 'sign-in',
    title: 'Welcome Back',
    subtitle: 'Enter your credentials to access the portal',
    fields: [
      { id: 'email', type: 'email', label: 'Email Address', placeholder: 'name@work.com' },
      { id: 'pass', type: 'password', label: 'Password', placeholder: '••••••••' },
      { id: 'rem', type: 'checkbox', label: 'Remember me on this device' }
    ],
    submitLabel: 'Sign In',
    secondaryActions: [
      { label: 'Forgot Password?', onClick: () => alert('Reset') }
    ],
    footerLink: { label: 'Contact Support', onClick: () => alert('Help') }
  };

  const registrationSchema: any = {
    id: 'register',
    title: 'Create Account',
    subtitle: 'Join the 40Labs network today',
    branding: { showLogoBadge: true },
    fields: [
      { id: 'biz', type: 'text', label: 'Business Name', placeholder: 'e.g. Afya Center' },
      {
        id: 'type',
        type: 'select',
        label: 'Type',
        options: [
          { label: 'Retail Pharmacy', value: 'retail' },
          { label: 'Wholesale', value: 'wholesale' },
          { label: 'Hospital', value: 'hospital' }
        ]
      },
      { id: 'phone', type: 'tel', label: 'Phone', placeholder: '+255...' },
    ],
    submitLabel: 'Continue to Location',
  };

  const mfaSchema: any = {
    id: 'mfa',
    title: 'Verify Identity',
    subtitle: 'A code was sent to your registered device',
    fields: [
      {
        id: 'otp',
        type: 'otp',
        label: 'Verification Code',
        placeholder: '000-000',
        otpAction: { label: 'Resend via Email', onSend: () => alert('Code Resent!') }
      }
    ],
    submitLabel: 'Verify & Authorize',
    secondaryActions: [{ label: 'Use Security Key instead', onClick: () => alert('Key'), variant: 'secondary' }]
  };

  // --- DOMAIN API MOCKS ---

  const mockCartItems: any[] = [
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
    {
      id: 'item-2',
      name: 'Amoxicillin 250mg',
      unitPrice: 8000,
      quantity: 1,
      unitType: 'Bottle',
      stockStatus: 'low-stock',
      currencyCode: 'TZS'
    }
  ];

  const mockCartSummary: any = {
    subtotal: 13000,
    discounts: [{ label: 'Member Promo', amount: 500 }],
    taxes: [{ label: 'VAT', rate: 18, amount: 2250 }],
    grandTotal: 14750,
    currencyCode: 'TZS'
  };

  const mockQuickActions: any[] = [
    { id: 'qa1', label: 'New Sale', icon: <ShoppingBag size={20} />, onClick: () => alert('New Sale'), variant: 'primary' },
    { id: 'qa2', label: 'Stock In', icon: <Package size={20} />, onClick: () => alert('Stock In'), variant: 'accent' },
    { id: 'qa3', label: 'Add Patient', icon: <Users size={20} />, onClick: () => alert('Add Patient'), permissionRequired: 'can_add_patient' },
    { id: 'qa4', label: 'Reports', icon: <BarChart3 size={20} />, onClick: () => alert('Reports'), variant: 'neutral' },
    { id: 'qa5', label: 'System Check', icon: <Activity size={20} />, onClick: () => alert('Diagnostics') },
    { id: 'qa6', label: 'Sync Logs', icon: <History size={20} />, onClick: () => alert('Syncing...') },
  ];

  const mockMetrics: any[] = [
    { title: 'Daily Revenue', value: 2450000, tone: 'primary', trendPercentage: 12, trendDirection: 'up', formatting: { prefix: 'TZS ' }, icon: <Activity size={18} /> },
    { title: 'Pending Orders', value: 42, tone: 'accent', trendPercentage: 5, trendDirection: 'down', icon: <ShoppingCart size={18} /> },
    { title: 'Low Stock SKU', value: 8, tone: 'danger', trendPercentage: 2, trendDirection: 'up', icon: <Package size={18} />, subtext: 'Critical items reaching zero' }
  ];

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

      {/* 9. ONBOARDING & SETUP */}
      <section className="space-y-6 pb-10">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">9. Onboarding & Setup</h2>
        <div className="flex justify-center py-10 bg-panel-strong/20 rounded-[3rem] border border-border/5">
          <OnboardingCarouselCard
            title={
              activeStep === 0 ? "Inventory Control" :
              activeStep === 1 ? "Real-time Sales" :
              "Clinical Insights"
            }
            features={
              activeStep === 0 ? [
                "Scan barcodes for lightning fast entry",
                "Batch & expiry date tracking",
                "Automated low-stock alerts"
              ] : activeStep === 1 ? [
                "Split-payment management",
                "Integrated thermal printing",
                "Offline transaction syncing"
              ] : [
                "Prescription validity checks",
                "Drug interaction warnings",
                "Patient compliance tracking"
              ]
            }
            activeStep={activeStep}
            totalSteps={3}
            primaryAction={{
              label: activeStep === 2 ? "Complete Setup" : "Next Feature",
              onClick: () => setActiveStep((s) => (s + 1) % 3)
            }}
            secondaryAction={activeStep > 0 ? {
              label: "Go Back",
              onClick: () => setActiveStep((s) => (s - 1 + 3) % 3)
            } : undefined}
          />
        </div>
      </section>

      {/* 11. AUTH FORM COMPOSITES (SCHEMA DRIVEN) */}
      <section className="space-y-6 pb-32">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">11. Auth Form Composites (Schema Driven)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Sign In Schema</h3>
            <AuthFormCard
              schema={signInSchema}
              onSubmit={(d) => console.log('Login:', d)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Registration Step 1</h3>
            <AuthFormCard
              schema={registrationSchema}
              onSubmit={(d) => console.log('Register:', d)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">MFA / OTP Schema</h3>
            <AuthFormCard
              schema={mfaSchema}
              onSubmit={(d) => console.log('MFA:', d)}
            />
          </div>
        </div>
      </section>

      {/* 12. AUTH SPECIALTY INPUTS (DYNAMIC) */}
      <section className="space-y-6 pb-32">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">12. Auth Specialty Inputs (Dynamic)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl">
          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Terms API Payload</h3>
            <TermsCheckboxGroup
              summary={<span>Unakubaliana na <strong>sera ya faragha</strong>?</span>}
              fullText="Hapa kuna maelezo ya kina kutoka kwa API..."
              expandLabel="Soma zaidi..."
              collapseLabel="Funga"
              groupName="terms_api"
              options={[
                { label: 'Kubali', value: 'yes' },
                { label: 'Kataa', value: 'no' }
              ]}
              onOptionChange={(v) => console.log('TOS:', v)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Dynamic Location Hierarchy</h3>
            <div className="bg-panel-strong/20 p-6 rounded-card border border-border/10">
              <LocationGpsGroup
                levels={[
                  { id: 'region', label: 'Region', placeholder: 'Select Region' },
                  { id: 'district', label: 'District', placeholder: 'Select District' },
                  { id: 'ward', label: 'Ward', placeholder: 'Enter Ward' }
                ]}
                gpsButtonLabel="Acquire GPS Coordinates"
                gpsButtonIcon={<MapPin size={14} />}
                onLocationChange={(id, v) => console.log(`Location ${id}:`, v)}
                onGeolocate={async () => {
                  await new Promise(r => setTimeout(r, 1000));
                  return { lat: -6.7924, lng: 39.2083 };
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 13. AUTH COMPLETION CARDS */}
      <section className="space-y-6 pb-32">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">13. Auth Completion Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl">
          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Account Success Card</h3>
            <AuthSuccessCard
              title="Congratulations!"
              message={
                <p>
                  You have successfully opened a business account for <span className="text-primary font-semibold">Afya Bora Pharmacy</span>.
                </p>
              }
              primaryAction={{ label: 'Anza', onClick: () => alert('Starting App...') }}
              secondaryActions={[
                { label: 'Download', onClick: () => alert('Downloading...'), icon: <Download size={16} /> },
                { label: 'Share', onClick: () => alert('Sharing...'), icon: <Share2 size={16} /> }
              ]}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Channel Connection List</h3>
            <ChannelConnectList
              title="Connect Channels"
              subtitle="Reach your customers where they are by connecting your favorite channels."
              channels={[
                { id: 'whatsapp', name: 'WhatsApp', description: 'Send receipts via WhatsApp', icon: <MessageCircle size={20} /> },
                { id: 'email', name: 'Email', description: 'Automated reports to email', icon: <Mail size={20} /> },
                { id: 'sms', name: 'SMS', description: 'Quick alerts via SMS', icon: <MessageSquare size={20} /> },
              ]}
              onConnect={(id) => alert(`Connecting to ${id}...`)}
              primaryAction={{ label: 'Anza', onClick: () => alert('Starting App...') }}
              secondaryAction={{ label: 'Skip For Now', onClick: () => alert('Skipping...') }}
            />
          </div>
        </div>
      </section>

      {/* 18. DYNAMIC DOMAIN COMPOSITES (API FEED) */}
      <section className="space-y-6 pb-32">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">18. Dynamic Domain Composites (API Feed)</h2>
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2 space-y-4">
               <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Real-time Cart Feed</h3>
               <div className="space-y-2 max-w-2xl">
                 {mockCartItems.map((item) => (
                   <CartItemRow
                     key={item.id}
                     item={item}
                     onQuantityChange={(id, q) => console.log('Qty:', id, q)}
                     onRemove={(id) => console.log('Remove:', id)}
                   />
                 ))}
               </div>
             </div>
             <div className="space-y-4">
               <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Summary API Payload</h3>
               <CartSummaryPanel
                 payload={mockCartSummary}
                 onConfirm={() => alert('Confirmed')}
                 onClear={() => alert('Cleared')}
                 onHold={() => alert('On Hold')}
               />
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">Dynamic Quick Actions (Role-Based)</h3>
            <QuickActionsGrid
              actions={mockQuickActions}
              userPermissions={['can_add_patient']}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-caption font-bold text-accent uppercase tracking-widest px-2">KPI Metric Feed</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockMetrics.map((metric, idx) => (
                <KPITile key={idx} {...metric} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 17. FULL APPLICATION LAYOUT INTEGRATION (API DRIVEN) */}
      <section className="space-y-6 pb-64">
        <h2 className="text-xl font-heading font-bold text-primary border-b border-border/30 pb-2">17. Full Application Layout Integration (API Driven)</h2>
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

          <div className="h-[800px] border-4 border-panel-strong rounded-[2rem] overflow-hidden shadow-surface-pop bg-surface relative group">
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
                   statusIndicatorColor={activePayload === 'hospital' ? 'red' : 'green'}
                   searchPlaceholder={activePayload === 'hospital' ? "Find patient by ID..." : "Search product..."}
                   searchHotkeys={['CTRL', 'K']}
                   statusIndicators={config.header.indicators}
                   actionButtons={[
                     { id: 'n1', icon: <Bell size={18} />, onClick: () => alert('Notifications'), hasBadge: true, badgeColor: activePayload === 'hospital' ? 'danger' : 'primary' }
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

                 <KPIGrid>
                   <KPICard
                     title={activePayload === 'hospital' ? "Occupancy Rate" : "Total Revenue"}
                     value={activePayload === 'hospital' ? "92%" : "TZS 4.2M"}
                     trend={{value: 12, isUp: true}}
                     tone="primary"
                   />
                   <KPICard title={activePayload === 'hospital' ? "Emergency" : "Active Orders"} value="24" tone="accent" />
                   <KPICard title={activePayload === 'hospital' ? "Waiting Time" : "Low Stock Items"} value={activePayload === 'hospital' ? "15m" : "8"} tone="danger" />
                 </KPIGrid>

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

      {/* FULL SCREEN PREVIEW MODE */}
      {fullScreenMode && (
        <div className="fixed inset-0 z-[9999] bg-surface">
           <div className="absolute top-4 right-4 z-[10000]">
              <Button intent="danger" size="md" onClick={() => setFullScreenMode(false)}>Exit Preview</Button>
           </div>
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
                 statusIndicatorColor={activePayload === 'hospital' ? 'red' : 'green'}
                 searchPlaceholder={activePayload === 'hospital' ? "Find patient by ID..." : "Search product..."}
                 searchHotkeys={['CTRL', 'K']}
                 statusIndicators={config.header.indicators}
                 actionButtons={[
                   { id: 'n1', icon: <Bell size={18} />, onClick: () => alert('Notifications'), hasBadge: true, badgeColor: activePayload === 'hospital' ? 'danger' : 'primary' }
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
                 <h2 className="text-3xl font-heading font-bold text-text capitalize">{activeRoute} Management</h2>
                 <div className="flex gap-3">
                   <Button intent="secondary" leftIcon={<Plus size={18} />}>Create New</Button>
                   <Button leftIcon={<FileText size={18} />}>Export Report</Button>
                 </div>
               </div>

               <KPIGrid>
                 <KPICard
                   title={activePayload === 'hospital' ? "Occupancy Rate" : "Total Revenue"}
                   value={activePayload === 'hospital' ? "92%" : "TZS 4.2M"}
                   trend={{value: 12, isUp: true}}
                   tone="primary"
                 />
                 <KPICard title={activePayload === 'hospital' ? "Emergency" : "Active Orders"} value="24" tone="accent" />
                 <KPICard title={activePayload === 'hospital' ? "Waiting Time" : "Low Stock Items"} value={activePayload === 'hospital' ? "15m" : "8"} tone="danger" />
               </KPIGrid>

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
      )}

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
