import * as React from 'react';
import type { MedicineWithInventory } from '@40labs/types';
import { PageViewport, PageHeader, PageContent, IconButton } from '@40labs/ui-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MedicineSearchPanel } from './components/MedicineSearchPanel';
import { SaleCartList } from './components/SaleCartList';
import { CustomerReportPanel, ConfirmedSaleData } from './components/CustomerReportPanel';
import { SaleTotalsBar } from './components/SaleTotalsBar';
import { useSales } from '../../hooks/useSales';
import { useInventory } from '../../hooks/useInventory';
import { useCustomers } from '../../hooks/useCustomers';

/**
 * SalesScreen (POS)
 *
 * Point of Sale checkout interface.
 * Preserves specialized 3-column split layout for rapid checkout while conforming to
 * the 40Labs canonical PageViewport -> PageHeader -> PageContent structure.
 */
export const SalesScreen: React.FC = () => {
  const { items: inventoryItems } = useInventory();
  const { customers } = useCustomers();

  const {
    cart,
    selectedCustomer,
    paymentMethod,
    discountAmount,
    users,
    addToCart,
    removeFromCart,
    updateQuantity,
    setSelectedCustomer,
    setPaymentMethod,
    setDiscountAmount,
    checkout,
    clearCart,
  } = useSales();

  const [manualEntry, setManualEntry] = React.useState<{ full_name: string; phone: string }>({
    full_name: '',
    phone: '',
  });
  const [storePanelOpen, setStorePanelOpen] = React.useState(true);
  const [customerPanelOpen, setCustomerPanelOpen] = React.useState(true);
  const [saveCustomer, setSaveCustomer] = React.useState(true);
  const [confirmedSale, setConfirmedSale] = React.useState<ConfirmedSaleData | null>(null);

  const dispensedUser = users[0] || { full_name: 'Pharmacy Staff' };

  const subtotal = React.useMemo(() => {
    return cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - discountAmount);
  const canConfirm = cart.length > 0;

  const handleAddToCart = React.useCallback((item: MedicineWithInventory) => {
    addToCart(item);
  }, [addToCart]);

  const handleConfirm = async () => {
    if (!canConfirm) return;

    const customerLabel = selectedCustomer?.full_name || manualEntry.full_name || 'Walk-in';
    const customerPhone = selectedCustomer?.phone || manualEntry.phone || 'N/A';
    const itemSummary = cart.map((c) => c.inventoryItem.medicine.name).join(', ');

    const completed = await checkout();
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
    <PageViewport>
      <PageHeader
        title="Point of Sale"
        subtitle="Process customer sales, search inventory, manage cart, and confirm transactions."
      />

      <PageContent scrollable={false} padding="normal">
        <div className="relative flex gap-6 h-full w-full overflow-hidden">
          {/* Customer Panel Toggle when closed */}
          {!customerPanelOpen && (
            <div className="absolute left-0 top-0 z-20">
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
          <div className="relative flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
            {!storePanelOpen && (
              <div className="absolute right-0 top-0 z-20">
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

            <div className="flex-1 min-h-0 overflow-hidden bg-panel-strong/40 rounded-card border border-border/50 p-4 elevation-inset">
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
        </div>
      </PageContent>
    </PageViewport>
  );
};
