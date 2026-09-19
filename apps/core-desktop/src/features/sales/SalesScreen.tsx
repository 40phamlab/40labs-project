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
import { CustomerReportPanel } from './CustomerReportPanel';
import { SaleTotalsBar } from './SaleTotalsBar';

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
  const [walkInInfo, setWalkInInfo] = React.useState<{
    full_name: string;
    phone: string;
  } | null>(null);
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState('cash');

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
    if (!selectedCustomer && walkInInfo?.full_name) {
      const newCustomer: Customer = {
        id: `cust_new_${Date.now()}`,
        workspace_id: WORKSPACE_ID,
        branch_id: BRANCH_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        full_name: walkInInfo.full_name,
        phone: walkInInfo.phone,
        email: null,
        outstanding_balance: 0,
        notes: 'Created from walk-in sales flow',
        amob_patient_id: null,
      };
      // In a real app, we'd persist this to DB/API here.
      console.log('[SalesScreen] Created new customer from walk-in:', newCustomer);
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

    // Reset flow
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setWalkInInfo(null);
    setPaymentMethod('cash');

    alert(`Sale completed successfully! Total: TZS ${newSale.grand_total.toLocaleString()}`);
  };

  const handleDelete = () => {
    setCart([]);
    setDiscount(0);
    setPaymentMethod('cash');
  };

  return (
    <div className="grid grid-cols-[300px_1fr_300px] gap-6 p-6 h-full overflow-hidden">
      {/* Left Column - Customer & Report */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <CustomerReportPanel
          customers={mockCustomers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(c) => {
            setSelectedCustomer(c);
            if (c) setWalkInInfo(null);
          }}
          walkInInfo={walkInInfo}
          onWalkInInfo={(info) => {
            setWalkInInfo(info);
            setSelectedCustomer(null);
          }}
          dispensedByName={dispensedUser.full_name}
          cartSummary={{
            itemNames: cartSummary.itemNames,
            grandTotal: cartSummary.grandTotal,
          }}
          canSend={canConfirm && (!!selectedCustomer || !!walkInInfo)}
        />
      </div>

      {/* Middle Column - Cart & Totals */}
      <div className="flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col gap-2 shrink-0">
          <h1 className="text-xl font-bold text-text">Sales & Dispensing</h1>
          <p className="text-xs text-text-muted">
            Manage line items, apply discounts, and confirm transactions.
          </p>
        </div>

        <div className="flex-1 overflow-hidden bg-panel/30 rounded-card border border-border/50 p-4">
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
            tax={cartSummary.tax}
            grandTotal={cartSummary.grandTotal}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onConfirm={handleConfirm}
            onDelete={handleDelete}
            disabled={!canConfirm}
          />
        </div>
      </div>

      {/* Right Column - Medicine Search */}
      <div className="flex flex-col gap-4">
        <div className="bg-panel/30 rounded-card border border-border/50 p-4">
          <h2 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-50 px-1">
            Find Medicine
          </h2>
          <MedicineSearchPanel
            medicines={medicinesWithInventory}
            onAdd={handleAddToCart}
          />
        </div>
      </div>
    </div>
  );
};
