import * as React from 'react';
import type { MedicineWithInventory } from '@40labs/types';
import { MedicineSearchPanel } from './MedicineSearchPanel';
import { SaleCartList } from './SaleCartList';
import { CustomerReportPanel, ConfirmedSaleData } from './CustomerReportPanel';
import { SaleTotalsBar } from './SaleTotalsBar';
import { IconButton, Card } from '@40labs/ui-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSalesStore } from '../../stores/useSalesStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCustomersStore } from '../../stores/useCustomersStore';
import { usersApi } from '../../api';

export const SalesScreen: React.FC = () => {
  const inventoryItems = useInventoryStore((s) => s.items);
  const customers = useCustomersStore((s) => s.customers);

  const cart = useSalesStore((s) => s.cart);
  const selectedCustomer = useSalesStore((s) => s.selectedCustomer);
  const paymentMethod = useSalesStore((s) => s.paymentMethod);
  const discountAmount = useSalesStore((s) => s.discountAmount);

  const addToCart = useSalesStore((s) => s.addToCart);
  const removeFromCart = useSalesStore((s) => s.removeFromCart);
  const updateQuantity = useSalesStore((s) => s.updateQuantity);
  const setSelectedCustomer = useSalesStore((s) => s.setSelectedCustomer);
  const setPaymentMethod = useSalesStore((s) => s.setPaymentMethod);
  const setDiscountAmount = useSalesStore((s) => s.setDiscountAmount);
  const checkout = useSalesStore((s) => s.checkout);
  const clearCart = useSalesStore((s) => s.clearCart);

  const [manualEntry, setManualEntry] = React.useState<{ full_name: string; phone: string }>({
    full_name: '',
    phone: '',
  });
  const [storePanelOpen, setStorePanelOpen] = React.useState(true);
  const [customerPanelOpen, setCustomerPanelOpen] = React.useState(true);
  const [saveCustomer, setSaveCustomer] = React.useState(true);
  const [confirmedSale, setConfirmedSale] = React.useState<ConfirmedSaleData | null>(null);

  const users = usersApi.list();
  const dispensedUser = users[0] || { full_name: 'Pharmacy Staff' };

  const subtotal = React.useMemo(() => {
    return cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - discountAmount);

  const canConfirm = cart.length > 0;

  const handleAddToCart = React.useCallback((item: MedicineWithInventory) => {
    addToCart(item);
  }, [addToCart]);

  const handleConfirm = () => {
    if (!canConfirm) return;

    const customerLabel = selectedCustomer?.full_name || manualEntry.full_name || 'Walk-in';
    const customerPhone = selectedCustomer?.phone || manualEntry.phone || 'N/A';
    const itemSummary = cart.map((c) => c.inventoryItem.medicine.name).join(', ');

    const completed = checkout();
    if (!completed) return;

    setConfirmedSale({
      customerLabel,
      phone: customerPhone,
      email: selectedCustomer?.email || '',
      service: dispensedUser.full_name,
      cost: completed.grand_total,
      description: itemSummary,
    });

    setManualEntry({ full_name: '', phone: '' });
  };

  const handleSendReportReset = () => {
    setConfirmedSale(null);
    setSelectedCustomer(null);
    setManualEntry({ full_name: '', phone: '' });
  };

  const handleDelete = () => {
    clearCart();
    setConfirmedSale(null);
  };

  const cartLinesForList = React.useMemo(() => {
    return cart.map((c) => ({
      item: c.inventoryItem,
      quantity: c.quantity,
    }));
  }, [cart]);

  return (
    <div className="p-6 h-full w-full overflow-hidden">
      <Card className="elevation-raised rounded-card h-full w-full p-6 flex gap-6 overflow-hidden bg-panel relative">
        {/* Customer Panel Toggle when closed */}
        {!customerPanelOpen && (
          <div className="absolute left-2 top-2 z-20">
            <IconButton
              icon={<ChevronRight size={16} />}
              label="Open customer panel"
              intent="neutral"
              size="sm"
              className="shadow-surface-pop border border-border/50"
              onClick={() => setCustomerPanelOpen(true)}
            />
          </div>
        )}

        {/* Left Column - Customer & Report */}
        <div
          className={`transition-all duration-200 overflow-hidden flex flex-col shrink-0 ${
            customerPanelOpen ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -ml-6'
          }`}
        >
          <CustomerReportPanel
            customers={customers}
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
            onToggleCollapse={() => setCustomerPanelOpen(false)}
          />
        </div>

        {/* Middle Column - Cart & Totals */}
        <div className="relative flex-1 min-w-0 flex flex-col gap-6 overflow-hidden">
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

          <div className="flex-1 min-h-0 overflow-hidden bg-panel-strong rounded-card border border-border/50 p-4 elevation-inset">
            <SaleCartList
              lines={cartLinesForList}
              onQuantityChange={updateQuantity}
              onRemove={removeFromCart}
            />
          </div>

          <div className="shrink-0">
            <SaleTotalsBar
              subtotal={subtotal}
              discount={discountAmount}
              onDiscountChange={setDiscountAmount}
              tax={0}
              grandTotal={grandTotal}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
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
            medicines={inventoryItems}
            onAdd={handleAddToCart}
            onToggleCollapse={() => setStorePanelOpen(false)}
          />
        </div>
      </Card>
    </div>
  );
};
