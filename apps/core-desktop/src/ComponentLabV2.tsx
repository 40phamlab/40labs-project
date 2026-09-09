import React, { useState } from 'react';
import { Customer, MedicineWithInventory } from '@40labs/types';
import {
  FilterTabs,
  EntityProfileHeader,
  ProductActionCard,
  InteractiveDataRow,
  SearchableListPanel,
  Skeleton,
  CompactProductRow,
  TabbedListContainer,
  GenericHistoryRow,
  ActionRequestCard,
  CategorySquare,
  ConfigToggleRow,
  OnboardingActionButton,
  HighlightableFeatureList,
  CarouselPaginationDots,
  CustomerPicker,
  CustomerSummary,
  MedicinePicker,
  MoneyDisplay,
  QuantityStepper,
  StockIndicator,
} from '@40labs/ui-components';

/**
 * ComponentLabV2
 * A pristine, blank slate for testing new UI components in isolation.
 */
export default function ComponentLabV2() {
  const [activePoFilter, setActivePoFilter] = useState('all');
  const [activeHistoryTab, setActiveHistoryTab] = useState('recently');
  const [activeCategory, setActiveCategory] = useState('1');
  const [activeDot, setActiveDot] = useState(1);

  // CustomerPicker Demo States
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [pickerError, setPickerError] = useState<string | undefined>(undefined);

  // MedicinePicker Demo States
  const [selectedMed, setSelectedMed] = useState<MedicineWithInventory | null>(null);
  const [showBatch, setShowBatch] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);

  // QuantityStepper Demo States
  const [standardQty, setStandardQty] = useState(2);
  const [packQty, setPackQty] = useState(2);
  const unitsPerPack = 10;

  const mockMedicines: MedicineWithInventory[] = [
    {
      id: 'm-1',
      name: 'Amoxicillin 500mg',
      generic_name: 'Amoxicillin Trihydrate',
      category: 'Antibiotics',
      unit: 'Capsule',
      is_controlled_substance: false,
      requires_prescription: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      inventory: {
        id: 'inv-1',
        medicine_id: 'm-1',
        batch_number: 'AMX-2024-001',
        expiry_date: '2025-12-31',
        buy_price: 8000,
        sell_price: 12500,
        quantity: 120,
        low_stock_threshold: 10,
        cold_chain_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    {
      id: 'm-2',
      name: 'Paracetamol 500mg',
      generic_name: 'Acetaminophen',
      category: 'Analgesics',
      unit: 'Tablet',
      is_controlled_substance: false,
      requires_prescription: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      inventory: {
        id: 'inv-2',
        medicine_id: 'm-2',
        batch_number: 'PARA-992',
        expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // Expiring soon
        buy_price: 1000,
        sell_price: 1500,
        quantity: 8, // Low stock
        low_stock_threshold: 15,
        cold_chain_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    {
      id: 'm-3',
      name: 'Tramadol 50mg',
      generic_name: 'Tramadol Hydrochloride',
      category: 'Opioids',
      unit: 'Capsule',
      is_controlled_substance: true,
      requires_prescription: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      inventory: {
        id: 'inv-3',
        medicine_id: 'm-3',
        batch_number: 'TRAM-007',
        expiry_date: '2026-06-30',
        buy_price: 5000,
        sell_price: 7500,
        quantity: 0, // Out of stock
        low_stock_threshold: 5,
        cold_chain_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  ];

  const mockCustomers: Customer[] = [
    {
      id: 'cust-1',
      full_name: 'John Doe',
      phone: '0712345678',
      email: 'john@example.com',
      outstanding_balance: 5000,
      notes: '',
      amob_patient_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cust-2',
      full_name: 'Jane Smith',
      phone: '0655111222',
      email: null,
      outstanding_balance: 0,
      notes: '',
      amob_patient_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cust-3',
      full_name: 'Bob Johnson',
      phone: '0788999000',
      email: 'bob@example.com',
      outstanding_balance: 12500,
      notes: '',
      amob_patient_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const [days, setDays] = useState([
    { day: 'Mon', active: true },
    { day: 'Tue', active: true },
    { day: 'Wed', active: false },
    { day: 'Thur', active: true },
     { day: 'Frid', active: false },
    { day: 'Sat', active: true },
    { day: 'Sun', active: true },
  ]);

  const toggleDay = (index: number, state: boolean) => {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, active: state } : d)),
    );
  };

  const [services, setServices] = useState([
    { name: 'e-pharmacy', mode: 'Public' },
    { name: 'Advice', mode: 'Private' },
    { name: 'Consultancy', mode: 'Both' },
  ]);

  const updateServiceMode = (index: number, newMode: string) => {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, mode: newMode } : s)),
    );
  };

  const categories = [
    { id: '1', label: 'Orders' },
    { id: '2', label: 'Reqst' },
    { id: '3', label: 'Dm\'s' },
  ];

  const historyTabs = [
    { id: 'stores', label: 'Stores' },
    { id: 'recently', label: 'Recently' },
    { id: 'pending', label: 'Pending', count: 3 },
    { id: 'completed', label: 'Completed' },
  ];

  const [customers, setCustomers] = useState([
    { id: 'c1', name: 'Alice Mwakinyo', lastVisit: '2023-10-12', balance: 'TZS 45,000', active: true },
    { id: 'c2', name: 'Bob Richards', lastVisit: '2023-10-15', balance: 'TZS 0', active: true },
    { id: 'c3', name: 'Charlie Sheen', lastVisit: '2023-09-28', balance: 'TZS 120,500', active: false },
    { id: 'c4', name: 'Diana Prince', lastVisit: '2023-10-18', balance: 'TZS 12,000', active: true },
  ]);

  const toggleCustomer = (id: string, state: boolean) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, active: state } : c));
  };

  const poTabs = [
    { id: 'all', label: 'All Orders', count: 124 },
    { id: 'pending', label: 'Pending', count: 12 },
    { id: 'approved', label: 'Approved', count: 45 },
    { id: 'shipped', label: 'Shipped', count: 30 },
    { id: 'received', label: 'Received', count: 37 },
  ];

  const mockSupplier = {
    id: 'sup_99',
    name: 'Global Pharma Logistics',
    email: 'contact@globalpharma.logistics',
    phone: '+255 754 123 456',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=GPL',
    statusIndicator: 'active' as const,
    verifications: ['TMDA', 'WHO', 'ISO-9001'],
  };

  const supplierActions = [
    {
      id: 'subscribe',
      label: 'Subscribe',
      variant: 'primary' as const,
      onClick: () => console.log('Subscribe clicked'),
    },
    {
      id: 'about',
      label: 'More About Us',
      onClick: () => console.log('More About Us clicked'),
    },
  ];

  const mockProducts = [
    {
      productName: 'Amoxicillin 500mg Caps',
      currentPrice: 'Tsh 12,500',
      originalPrice: 'Tsh 15,000',
      badgeUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Amox',
    },
    {
      productName: 'Paracetamol BP 500mg',
      currentPrice: 'Tsh 2,000',
    },
    {
      productName: 'Cetirizine HCl 10mg',
      currentPrice: 'Tsh 5,800',
      originalPrice: 'Tsh 7,200',
      badgeUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Ceti',
    },
  ];

  const mockCompactMedicines = [
    {
      id: 'm1',
      name: 'Paracetamol',
      priceFormatted: 'Tsh 1,500',
      scientificName: 'Acetaminophen 500mg',
    },
    {
      id: 'm2',
      name: 'Amoxicillin',
      priceFormatted: 'Tsh 8,000',
      scientificName: 'Amoxicillin Trihydrate 250mg',
    },
    {
      id: 'm3',
      name: 'Diclofenac',
      priceFormatted: 'Tsh 3,200',
      scientificName: 'Diclofenac Sodium 50mg',
    },
  ];

  const mockRequests = [
    {
      title: 'Amoxicillin 500mg',
      details: ['John Doe', '+255 700 000 000'],
      actionLabel: 'Solve',
    },
    {
      title: 'Paracetamol',
      details: ['Jane Smith', '+255 711 111 111'],
      actionLabel: 'Solve',
    },
    {
      title: 'Ibuprofen 400mg',
      details: ['Walk-in Patient', 'N/A'],
      actionLabel: 'Pending',
    },
  ];

  const mockFeatures = [
    { text: 'Online Selling' },
    { text: 'Daily reports' },
    { text: 'In app purchasing', highlightWord: 'purchasing' },
    { text: 'More customers' },
    { text: 'Reach out' },
    { text: 'Collaborate' },
  ];

  return (
    <div className="h-screen w-full bg-surface text-text overflow-y-auto scrollbar-thin">
      <div className="flex flex-col items-center p-12 gap-16 pb-40 max-w-7xl mx-auto">
        {/* Primitives & Data Atoms Section */}
        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Primitives & Data Atoms
          </h3>
          <div className="bg-panel p-8 rounded-card elevation-raised space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider">MoneyDisplay Varieties</p>
              <div className="flex flex-col gap-4 bg-panel-strong/30 p-6 rounded-input border border-border/10">
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <span className="text-xs text-text-muted">Standard</span>
                  <MoneyDisplay amount={10000} />
                </div>
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <span className="text-xs text-text-muted">Large (Strong)</span>
                  <MoneyDisplay amount={1250000} emphasis="strong" />
                </div>
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <span className="text-xs text-text-muted">Negative Colorized</span>
                  <MoneyDisplay amount={-25000} colorize />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Compact (No Currency)</span>
                  <MoneyDisplay amount={1250000} compact showCurrency={false} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/10">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Quantity Stepper Atoms</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[9px] text-text-muted uppercase font-bold">Standard Unit Stepper (Max 8)</p>
                  <div className="p-4 bg-panel-strong/30 rounded-input border border-border/10 flex justify-center">
                    <QuantityStepper
                      value={standardQty}
                      onChange={setStandardQty}
                      min={1}
                      max={8}
                      error={standardQty >= 8 ? "Maximum stock reached" : undefined}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] text-text-muted uppercase font-bold">Pack Stepper (Units: {packQty * unitsPerPack})</p>
                  <div className="p-4 bg-panel-strong/30 rounded-input border border-border/10 flex justify-center">
                    <QuantityStepper
                      value={packQty}
                      onChange={setPackQty}
                      min={0}
                      unit="Packs"
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Status Section */}
        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Stock Status Widgets
          </h3>
          <div className="bg-panel p-8 rounded-card elevation-raised">
            <div className="space-y-6">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Inventory Health Indicators</p>
              <div className="flex flex-col gap-4 bg-panel-strong/30 p-6 rounded-input border border-border/10">
                <div className="flex items-center justify-between border-b border-border/10 pb-3">
                  <span className="text-xs text-text-muted">High Stock Item</span>
                  <StockIndicator quantity={120} />
                </div>
                <div className="flex items-center justify-between border-b border-border/10 pb-3">
                  <span className="text-xs text-text-muted">Critical Level</span>
                  <StockIndicator quantity={8} lowStockThreshold={15} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Depleted Stock</span>
                  <StockIndicator quantity={0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Section */}
        <div className="w-full max-w-sm grid grid-cols-1 gap-12">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
              Highlightable Feature List
            </h3>
            <div className="bg-panel p-6 rounded-card elevation-raised">
              <HighlightableFeatureList features={mockFeatures} />
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
              Onboarding Interaction
            </h3>
            <div className="bg-panel p-6 rounded-card elevation-raised flex flex-col items-center gap-6">
              <CarouselPaginationDots
                total={4}
                activeIndex={activeDot}
                onChange={setActiveDot}
              />
              <div className="text-[10px] text-text-muted font-mono uppercase">
                Slide {activeDot + 1} of 4
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <OnboardingActionButton
                label="Get started"
                themeVariant="brand-primary"
                onClick={() => console.log('Get started clicked')}
              />
              <OnboardingActionButton
                label="New Device"
                themeVariant="brand-accent"
                onClick={() => console.log('New Device clicked')}
              />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1">
                  Already have an account?
                </span>
                <OnboardingActionButton
                  label="Sign In"
                  themeVariant="outline-arrow"
                  onClick={() => console.log('Sign In clicked')}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Selection Section */}
        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Medicine Picker Composite
          </h3>

          <div className="bg-panel p-8 rounded-card elevation-raised space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  Medicine Search & Inventory
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showBatch} onChange={e => setShowBatch(e.target.checked)} className="w-3 h-3" />
                    <span className="text-[10px] text-text-muted font-bold uppercase">Show Batch</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showExpiry} onChange={e => setShowExpiry(e.target.checked)} className="w-3 h-3" />
                    <span className="text-[10px] text-text-muted font-bold uppercase">Show Expiry</span>
                  </label>
                </div>
              </div>

              <MedicinePicker
                value={selectedMed}
                onChange={setSelectedMed}
                medicines={mockMedicines}
                showBatch={showBatch}
                showExpiry={showExpiry}
                placeholder="Find medicine by name or generic..."
              />

              <div className="p-4 bg-panel-strong/30 rounded-input border border-border/10">
                 <p className="text-[10px] text-text-muted uppercase font-bold mb-3 border-b border-border/20 pb-1">Selection Detail</p>
                 {selectedMed ? (
                   <div className="grid grid-cols-2 gap-y-3">
                      <div>
                        <p className="text-[9px] text-text-muted uppercase font-bold">Scientific Name</p>
                        <p className="text-xs">{selectedMed.generic_name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-muted uppercase font-bold">Category</p>
                        <p className="text-xs">{selectedMed.category}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-muted uppercase font-bold">Stock Status</p>
                        <Badge variant={selectedMed.inventory && selectedMed.inventory.quantity > 0 ? 'success' : 'danger'} size="sm">
                          {selectedMed.inventory?.quantity ?? 0} {selectedMed.unit}s
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-muted uppercase font-bold">Price</p>
                        <p className="text-xs font-mono font-bold text-primary">TZS {selectedMed.inventory?.sell_price.toLocaleString()}</p>
                      </div>
                   </div>
                 ) : (
                   <p className="text-xs text-text-muted italic text-center py-2">No medicine selected</p>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Selection Section */}
        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Customer Picker Composite
          </h3>

          <div className="bg-panel p-8 rounded-card elevation-raised space-y-10">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider">
                1. Standard Selection & Search
              </p>
              <CustomerPicker
                value={selectedCust}
                onChange={setSelectedCust}
                customers={mockCustomers}
                onWalkIn={() => setSelectedCust(null)}
                onCreateCustomer={(data) => console.log('Create customer:', data)}
              />
              <CustomerSummary
                customer={selectedCust}
                isWalkIn={selectedCust === null}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border/10">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider">
                2. Error State Demo
              </p>
              <CustomerPicker
                onChange={() => {}}
                customers={mockCustomers}
                error={pickerError || "Failed to fetch customers from remote server"}
              />
              <button
                onClick={() => setPickerError(pickerError ? undefined : "API Connection timeout")}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                Toggle Error State
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/10">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider">
                3. Loading State Demo
              </p>
              <CustomerPicker
                onChange={() => {}}
                loading={true}
                placeholder="Synchronizing database..."
              />
            </div>
          </div>
        </div>

        {/* Pharmacy Configuration Section */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Stack 1: Days */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
              Operation Days
            </h3>
            <div className="bg-panel p-4 rounded-card elevation-raised divide-y divide-border/5">
              {days.map((d, i) => (
                <ConfigToggleRow
                  key={d.day}
                  label={d.day}
                  type="switch"
                  value={d.active}
                  onChange={(state) => toggleDay(i, state)}
                />
              ))}
            </div>
          </div>

          {/* Stack 2: Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
              Available Services
            </h3>
            <div className="bg-panel p-4 rounded-card elevation-raised divide-y divide-border/5">
              {services.map((s, i) => (
                <ConfigToggleRow
                  key={s.name}
                  label={s.name}
                  type="select"
                  value={s.mode}
                  options={['Public', 'Private', 'Both', 'Mode']}
                  onChange={(val) => updateServiceMode(i, val)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pharmacy Categories Section */}
        <div className="w-full max-w-2xl space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Pharmacy Category Squares
          </h3>
          <div className="flex justify-center gap-4">
            {categories.map((cat) => (
              <CategorySquare
                key={cat.id}
                label={cat.label}
                isActive={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Patient Requests Section */}
        <div className="w-full max-w-2xl space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Patient Action Requests
          </h3>
          <div className="flex flex-col gap-3">
            {mockRequests.map((req, i) => (
              <ActionRequestCard
                key={i}
                title={req.title}
                details={req.details}
                actionLabel={req.actionLabel}
                onAction={() => console.log('Action performed on:', req.title)}
              />
            ))}
          </div>
        </div>

        {/* Compact Product Rows Section */}
        <div className="w-full max-w-4xl space-y-4">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
          Purchase History & Tabs
        </h3>
        <div className="bg-panel-strong/10 p-6 rounded-card min-h-[400px]">
          <TabbedListContainer
            tabs={historyTabs}
            activeTabId={activeHistoryTab}
            onTabChange={setActiveHistoryTab}
          >
            {[...Array(5)].map((_, i) => (
              <GenericHistoryRow
                key={i}
                id={`hist-${i}`}
                content={
                  <div className="flex justify-between items-center w-full">
                    <div className="space-y-1">
                      <p className="font-bold">Order #00{i + 124}</p>
                      <p className="text-xs text-text-muted">
                        2 items • Oct {18 - i}, 2023
                      </p>
                    </div>
                    <p className="font-mono font-bold text-accent">
                      Tsh {Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
                    </p>
                  </div>
                }
              />
            ))}
          </TabbedListContainer>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Compact Product Rows
          </h3>
          <div className="bg-panel p-4 rounded-card elevation-raised space-y-3">
            {mockCompactMedicines.map((m) => (
              <CompactProductRow
                key={m.id}
                product={m}
                onAdd={(id) => console.log('Added to cart:', id)}
                onMoreInfo={(id) => console.log('Viewing info for:', id)}
              />
            ))}
          </div>
        </div>

        {/* Product Grid Section */}
        <div className="w-full max-w-5xl space-y-6">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Product Action Cards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProducts.map((p, idx) => (
              <ProductActionCard
                key={idx}
                {...p}
                onAddToCart={() => console.log('Added', p.productName)}
                onCommunicate={() => console.log('Communicate for', p.productName)}
                onMoreInfo={() => console.log('More info for', p.productName)}
              />
            ))}
          </div>
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-[500px] md:col-span-1">
          <SearchableListPanel
            panelTitle="Inventory Items"
            onSearch={(q) => console.log('Searching for:', q)}
            searchPlaceholder="Filter items..."
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="p-3 bg-panel-strong/20 rounded-input flex gap-3 items-center"
              >
                <Skeleton variant="circle" className="w-8 h-8 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-3/4" />
                  <Skeleton variant="text" className="w-1/2 opacity-50" />
                </div>
              </div>
            ))}
          </SearchableListPanel>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Composite Layout Details
          </h3>
          <p className="text-xs text-text-muted italic">
            The left panel demonstrates sticky search with scrollable skeleton placeholders.
          </p>
          <div className="bg-panel p-6 rounded-card elevation-raised min-h-[400px] flex items-center justify-center border-2 border-dashed border-border/20 text-center">
            <span className="text-text-muted opacity-30 uppercase font-bold tracking-tighter">
              Primary Viewport Area
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Interactive Data Rows
          </h3>
          <div className="bg-panel rounded-card overflow-hidden elevation-raised">
            {customers.map((c) => (
              <InteractiveDataRow
                key={c.id}
                id={c.id}
                name={c.name}
                avatarUrl={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`}
                columns={[
                  { key: 'name', value: c.name },
                  { key: 'lastVisit', value: c.lastVisit },
                  {
                    key: 'balance',
                    value: <span className="font-mono text-accent">{c.balance}</span>,
                  },
                ]}
                toggleConfig={{
                  isActive: c.active,
                  onToggle: (state) => toggleCustomer(c.id, state),
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-full max-w-4xl space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Entity Profile Header
          </h3>
          <EntityProfileHeader entity={mockSupplier} actions={supplierActions} />
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Purchase Order Filters
          </h3>
          <FilterTabs
            tabs={poTabs}
            activeTabId={activePoFilter}
            onChange={setActivePoFilter}
          />
        </div>

        <div className="text-text-muted italic opacity-20 select-none">
          Component Lab V2: Pristine Slate
        </div>
      </div>
    </div>
  );
}
