import { useState } from 'react';
import type { Customer, MedicineWithInventory } from '@40labs/types';
import {
  FilterTabs,
  EntityProfileHeader,
  MoneyDisplay,
  QuantityStepper,
  Button,
} from '@40labs/ui-components';
import { CustomerPicker } from '../features/customers/components/CustomerPicker';
import { MedicinePicker } from '../features/sales/components/MedicinePicker';
import { StockIndicator } from '../features/inventory/components/StockIndicator';
import { ConfigToggleRow } from '../features/sales/components/ConfigToggleRow';
import { CategorySquare } from '../features/inventory/components/CategorySquare';
import { CompactProductRow } from '../features/purchases/components/CompactProductRow';
import { ProductActionCard } from '../features/purchases/components/ProductActionCard';
import { useFilePreviewContext } from '../providers/FilePreviewProvider';
import { createReportPdfBlob } from '../features/reports/utils/exportReportPdf';
import { ThemeLogo, LoaderAnimation } from '../components/brand';

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

  const { openBlob, openAttachment } = useFilePreviewContext();

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

  const handlePreviewAudio = () => {
    openAttachment({
      id: 'att_audio_sample',
      workspace_id: 'ws_demo',
      branch_id: 'br_demo',
      message_id: 'msg_demo',
      kind: 'audio',
      file_name: 'notification.mp3',
      mime_type: 'audio/mpeg',
      size_bytes: 47800,
      storage_path: '',
      sha256: '',
      duration_ms: 3000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      url: '/media/audio/notification.mp3',
    } as any);
  };

  const handlePreviewPdfBlob = () => {
    const blob = createReportPdfBlob({
      title: 'Sample Lab & Inventory Report',
      categoryLabel: 'Laboratory',
      periodLabel: 'October 2026',
      generatedAt: new Date().toLocaleString(),
      kpis: [{ label: 'Total Samples', value: '1,420' }, { label: 'Compliance', value: '99.4%' }],
      columns: [{ key: 'test', header: 'Test Name' }, { key: 'status', header: 'Status' }],
      rows: [{ test: 'Complete Blood Count', status: 'Passed' }, { test: 'Malaria Microscopy', status: 'Completed' }],
    });
    openBlob({ fileName: 'Sample_Report.pdf', mimeType: 'application/pdf', blob });
  };

  const handlePreviewCsvBlob = () => {
    const blob = new Blob(['Item,Stock,Price\nAmoxicillin,120,12500\nParacetamol,340,1500'], { type: 'text/csv' });
    openBlob({ fileName: 'inventory_export.csv', mimeType: 'text/csv', blob });
  };

  const handlePreviewDocxBlob = () => {
    const blob = new Blob(['Sample Word Document Content rendered via Mammoth in FilePreview.'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    openBlob({ fileName: 'Release_Notes.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', blob });
  };

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

        {/* FilePreview Section */}
        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            FilePreview Reusable Viewers & Icons
          </h3>
          <div className="bg-panel p-8 rounded-card elevation-raised flex flex-wrap gap-4 justify-center">
            <Button type="button" intent="secondary" onClick={handlePreviewAudio}>
              Preview Audio (.mp3)
            </Button>
            <Button type="button" intent="secondary" onClick={handlePreviewPdfBlob}>
              Preview PDF Blob
            </Button>
            <Button type="button" intent="secondary" onClick={handlePreviewCsvBlob}>
              Preview CSV Data
            </Button>
            <Button type="button" intent="secondary" onClick={handlePreviewDocxBlob}>
              Preview Word (.docx)
            </Button>
          </div>
        </div>

        {/* Brand & Media Foundation Section */}
        <div className="w-full max-w-xl space-y-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest text-center">
            Brand & Media Foundation (Phase 9A)
          </h3>
          <div className="bg-panel p-8 rounded-card elevation-raised flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
              <div className="text-center space-y-2">
                <span className="text-xs text-text-muted block">ThemeLogo (Full)</span>
                <div>
                  <ThemeLogo variant="full" height={40} />
                </div>
              </div>
              <div className="text-center space-y-2">
                <span className="text-xs text-text-muted block">ThemeLogo (Mark)</span>
                <div>
                  <ThemeLogo variant="mark" height={40} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8 pt-4 border-t border-border w-full justify-around">
              <div className="text-center space-y-2">
                <span className="text-xs text-text-muted block">Loader (&lt;2s Instant)</span>
                <LoaderAnimation variant="instant" size={32} label="Loading data..." />
              </div>
              <div className="text-center space-y-2">
                <span className="text-xs text-text-muted block">Loader (&gt;=2s Long)</span>
                <LoaderAnimation variant="long" size={32} label="Syncing database..." />
              </div>
            </div>
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
