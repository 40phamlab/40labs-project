import * as React from 'react';
import {
  mockMedicines,
  mockInventoryItems,
  mockCustomers,
  mockUsers,
  WORKSPACE_ID,
  BRANCH_ID,
} from '../../lib/mockData';
import { MedicineWithInventory, Customer, Sale } from '@40labs/types';
import { MedicineSearchPanel } from './MedicineSearchPanel';
import { SaleCartList, SaleCartLine } from './SaleCartList';
import { CustomerReportPanel, ConfirmedSaleData } from './CustomerReportPanel';
import { SaleTotalsBar } from './SaleTotalsBar';
import { IconButton, Card } from '@40labs/ui-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const SalesScreen: React.FC = () => {
  // Prep the data for MedicinePicker
  const medicinesWithInventory: MedicineWithInventory[] = React.useMemo(() => {
    return mockMedicines.map((m) => ({
      ...m,
      inventory: mockInventoryItems.find((i) => i.medicine_id === m.id),
    }));
  }, []);

  // State
  const [cart, setCart] = React.useState<SaleCartLine[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(
    null
  );
  const [manualEntry, setManualEntry] = React.useState<{
    full_name: string;
    phone: string;
  }>({ full_name: '', phone: '' });
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState('cash');
  const [storePanelOpen, setStorePanelOpen] = React.useState(true);
  const [saveCustomer, setSaveCustomer] = React.useState(true);
  const [confirmedSale, setConfirmedSale] = React.useState<ConfirmedSaleData | null>(null);

  const dispensedUser = mockUsers[0]; // Mock session user

  // Derived values
  const cartSummary = React.useMemo(() => {
    const subtotal = cart.reduce(
      (sum, line) =>
        sum + (line.medicine.inventory?.sell_price || 0) * line.quantity,
      0
    );
    const tax = 0;
    const grandTotal = subtotal - discount + tax;

    return {
      itemNames: cart.map((line) => line.medicine.name),
      subtotal,
      tax,
      grandTotal,
    };
  }, [cart, discount]);

  const canConfirm = cart.length > 0;

  // Handlers
  const handleAddToCart = React.useCallback(
    (medicine: MedicineWithInventory) => {
      setCart((prev) => {
        const existing = prev.find((line) => line.medicine.id === medicine.id);
        if (existing) {
          return prev.map((line) =>
            line.medicine.id === medicine.id
              ? { ...line, quantity: line.quantity + 1 }
              : line
          );
        }
        return [...prev, { medicine, quantity: 1 }];
      });
    },
    []
  );

  const handleQuantityChange = React.useCallback(
    (medicineId: string, qty: number) => {
      setCart((prev) =>
        qty <= 0
          ? prev.filter((line) => line.medicine.id !== medicineId)
          : prev.map((line) =>
              line.medicine.id === medicineId
                ? { ...line, quantity: qty }
                : line
            )
      );
    },
    []
  );

  const handleRemoveItem = React.useCallback((medicineId: string) => {
    setCart((prev) => prev.filter((line) => line.medicine.id !== medicineId));
  }, []);

  const handleConfirm = () => {
    if (!canConfirm) return;

    let customerId: string | null = selectedCustomer?.id || null;

    // Handle walk-in info persistence
    if (!selectedCustomer && manualEntry.full_name && saveCustomer) {
      const newCustomer: Customer = {
        id: `cust_new_${Date.now()}`,
        workspace_id: WORKSPACE_ID,
        branch_id: BRANCH_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        full_name: manualEntry.full_name,
        phone: manualEntry.phone,
        email: null,
        outstanding_balance: 0,
        notes: 'Created from walk-in sales flow',
        amob_patient_id: null,
      };
      // In a real app, we'd persist this to DB/API here.
      console.log('[SalesScreen] Created new customer from manual entry:', newCustomer);
      customerId = newCustomer.id;
    }

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_id: customerId,
      lines: cart.map((line, idx) => ({
        id: `saleline_${Date.now()}_${idx}`,
        inventory_item_id: line.medicine.inventory?.id || '',
        medicine_id: line.medicine.id,
        quantity: line.quantity,
        unit_price: line.medicine.inventory?.sell_price || 0,
        subtotal: (line.medicine.inventory?.sell_price || 0) * line.quantity,
        dispensed_by_user_id: dispensedUser.id,
        is_prescription_dispense: line.medicine.requires_prescription,
      })),
      payment_method: paymentMethod as any,
      discount_amount: discount,
      discount_authorized_by_user_id: discount > 0 ? dispensedUser.id : null,
      tax_amount: cartSummary.tax,
      grand_total: cartSummary.grandTotal,
      currency: 'TZS',
      synced_at: null, // Queued for sync
    };

    console.log('[SalesScreen] Sale completed:', newSale);

    // Set confirmed sale data for the report card
    setConfirmedSale({
      customerLabel: selectedCustomer?.full_name || manualEntry.full_name || 'Walk-in',
      phone: selectedCustomer?.phone || manualEntry.phone || 'N/A',
      email: selectedCustomer?.email || '',
      service: dispensedUser.full_name,
      cost: cartSummary.grandTotal,
      description: cartSummary.itemNames.join(', ') || 'No items',
    });

    // Reset commerce state immediately for next transaction
    setCart([]);
    setDiscount(0);
    setPaymentMethod('cash');

    alert(`Sale completed successfully! Total: TZS ${newSale.grand_total.toLocaleString()}`);
  };

  const handleSendReportReset = () => {
    // Transaction fully closed only after report is sent or dismissed
    setConfirmedSale(null);
    setSelectedCustomer(null);
    setManualEntry({ full_name: '', phone: '' });
  };

  const handleDelete = () => {
    setCart([]);
    setDiscount(0);
    setPaymentMethod('cash');
    setConfirmedSale(null);
  };

  return (
    <div className="p-6 h-full w-full overflow-hidden">
      <Card className="elevation-raised rounded-card h-full w-full p-6 flex gap-6 overflow-hidden bg-panel">
        {/* Left Column - Customer & Report */}
        <div className="w-[300px] shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <CustomerReportPanel
            customers={mockCustomers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={(c) => {
              setSelectedCustomer(c);
              if (c) setManualEntry({ full_name: '', phone: '' });
            }}
            manualEntry={manualEntry}
            onManualEntryChange={(info) => {
              setManualEntry(info);
              setSelectedCustomer(null);
            }}
            confirmedSale={confirmedSale}
            onSend={handleSendReportReset}
            saveCustomer={saveCustomer}
            onSaveCustomerChange={setSaveCustomer}
          />
        </div>

        {/* Middle Column - Cart & Totals */}
        <div className="relative flex-1 min-w-0 flex flex-col gap-6 overflow-hidden">
          {/* Store Open Toggle Button when closed */}
          {!storePanelOpen && (
            <div className="absolute right-2 top-2 z-20">
              <IconButton
                icon={<ChevronLeft size={16} />}
                label="Open store panel"
                intent="neutral"
                size="sm"
                className="shadow-surface-pop border border-border/50"
                onClick={() => setStorePanelOpen(true)}
              />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden bg-surface-strong rounded-card border border-border/50 p-4 elevation-inset">
            <SaleCartList
              lines={cart}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
            />
          </div>

          <div className="shrink-0">
            <SaleTotalsBar
              subtotal={cartSummary.subtotal}
              discount={discount}
              onDiscountChange={setDiscount}
              tax={cartSummary.tax}
              grandTotal={cartSummary.grandTotal}
              paymentMethod={paymentMethod as any}
              onPaymentMethodChange={setPaymentMethod as any}
              onConfirm={handleConfirm}
              onDelete={handleDelete}
              disabled={!canConfirm}
            />
          </div>
        </div>

        {/* Right Column - Medicine Search */}
        <div
          className={`transition-all duration-200 overflow-hidden flex flex-col shrink-0 ${
            storePanelOpen ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -ml-6'
          }`}
        >
          <MedicineSearchPanel
            medicines={medicinesWithInventory}
            onAdd={handleAddToCart}
            onToggleCollapse={() => setStorePanelOpen(false)}
          />
        </div>
      </Card>
    </div>
  );
};
