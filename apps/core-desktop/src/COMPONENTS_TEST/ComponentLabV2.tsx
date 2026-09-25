import { useState } from 'react';
import { Customer, MedicineWithInventory } from '@40labs/types';
import {
  FilterTabs,
  EntityProfileHeader,
  MoneyDisplay,
  QuantityStepper,
} from '@40labs/ui-components';
import { CustomerPicker } from '../features/customers/components/CustomerPicker';
import { MedicinePicker } from '../features/sales/components/MedicinePicker';
import { StockIndicator } from '../features/inventory/components/StockIndicator';
import { ConfigToggleRow } from '../features/sales/components/ConfigToggleRow';
import { CategorySquare } from '../features/inventory/components/CategorySquare';
import { CompactProductRow } from '../features/purchases/components/CompactProductRow';
import { ProductActionCard } from '../features/purchases/components/ProductActionCard';

export default function ComponentLabV2() {
  const [activePoFilter, setActivePoFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('1');

  // CustomerPicker Demo States
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [manualEntry, setManualEntry] = useState({ full_name: '', phone: '' });

  // MedicinePicker Demo States
  const [selectedMed, setSelectedMed] = useState<MedicineWithInventory | null>(null);

  // QuantityStepper Demo States
  const [standardQty, setStandardQty] = useState(2);

  const mockMedicines: MedicineWithInventory[] = [
    {
      id: 'inv-1',
      workspace_id: 'ws-demo-1',
      branch_id: 'branch-demo-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      medicine_id: 'm-1',
      batch_number: 'AMX-2024-001',
      expiry_date: '2025-12-31',
      buy_price: 8000,
      sell_price: 12500,
      quantity: 120,
      low_stock_threshold: 10,
      cold_chain_required: false,
      medicine: {
        id: 'm-1',
        workspace_id: 'ws-demo-1',
        branch_id: 'branch-demo-1',
        name: 'Amoxicillin 500mg',
        generic_name: 'Amoxicillin Trihydrate',
        category: 'Antibiotics',
        unit: 'Capsule',
        is_controlled_substance: false,
        requires_prescription: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
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
      workspace_id: 'ws-demo-1',
      branch_id: 'branch-demo-1',
    },
  ];

  const [days, setDays] = useState([
    { day: 'Mon', active: true },
    { day: 'Tue', active: true },
  ]);

  const toggleDay = (index: number, state: boolean) => {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, active: state } : d)),
    );
  };

  const categories = [
    { id: '1', label: 'Orders' },
    { id: '2', label: 'Reqst' },
  ];

  const poTabs = [
    { id: 'all', label: 'All Orders', count: 124 },
    { id: 'pending', label: 'Pending', count: 12 },
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
  ];

  const mockProducts = [
    {
      productName: 'Amoxicillin 500mg Caps',
      currentPrice: 'Tsh 12,500',
      originalPrice: 'Tsh 15,000',
    },
  ];

  const mockCompactMedicines = [
    {
      id: 'm1',
      name: 'Paracetamol',
      priceFormatted: 'Tsh 1,500',
      scientificName: 'Acetaminophen 500mg',
    },
  ];

  return (
    <div className="h-screen w-full bg-surface text-text overflow-y-auto scrollbar-thin">
      <div className="flex flex-col items-center p-12 gap-16 pb-40 max-w-7xl mx-auto">
        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Primitives & Data Atoms
          </h3>
          <div className="bg-panel p-8 rounded-card elevation-raised space-y-6">
            <MoneyDisplay amount={10000} />
            <QuantityStepper value={standardQty} onChange={setStandardQty} min={1} max={8} />
          </div>
        </div>

        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Stock Status Widgets
          </h3>
          <StockIndicator quantity={120} />
        </div>

        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Medicine Picker Composite
          </h3>
          <MedicinePicker
            value={selectedMed}
            onChange={setSelectedMed}
            medicines={mockMedicines}
          />
        </div>

        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Customer Picker Composite
          </h3>
          <CustomerPicker
            value={selectedCust}
            manualEntry={manualEntry}
            onSelectCustomer={setSelectedCust}
            onManualEntryChange={setManualEntry}
            customers={mockCustomers}
          />
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
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

        <div className="w-full max-w-2xl flex justify-center gap-4">
          {categories.map((cat) => (
            <CategorySquare
              key={cat.id}
              label={cat.label}
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>

        <div className="w-full max-w-2xl space-y-4">
          {mockCompactMedicines.map((m) => (
            <CompactProductRow
              key={m.id}
              product={m}
              onAdd={(id) => console.log('Added to cart:', id)}
              onMoreInfo={(id) => console.log('Viewing info for:', id)}
            />
          ))}
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <div className="w-full max-w-4xl">
          <EntityProfileHeader entity={mockSupplier} actions={supplierActions} />
        </div>

        <div className="w-full max-w-2xl">
          <FilterTabs
            tabs={poTabs}
            activeTabId={activePoFilter}
            onChange={setActivePoFilter}
          />
        </div>
      </div>
    </div>
  );
}
