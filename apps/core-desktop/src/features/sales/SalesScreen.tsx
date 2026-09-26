import * as React from 'react';
import type { MedicineWithInventory } from '@40labs/types';
import {
  PageViewport,
  PageHeader,
  PageToolbar,
  PageContent,
  IconButton,
  Button,
  Badge,
} from '@40labs/ui-components';
import { ChevronLeft, ChevronRight, PauseCircle, Calculator, RefreshCw, PlusCircle } from 'lucide-react';
import { MedicineSearchPanel } from './components/MedicineSearchPanel';
import { SaleCartList } from './components/SaleCartList';
import { CustomerReportPanel, ConfirmedSaleData } from './components/CustomerReportPanel';
import { SaleTotalsBar } from './components/SaleTotalsBar';
import { ReceiptModal } from './components/ReceiptModal';
import { HoldSalesModal } from './components/HoldSalesModal';
import { Numpad } from './components/Numpad';
import { ReceiptItem } from './components/ReceiptPreview';
import { useSales } from '../../hooks/useSales';
import { useInventory } from '../../hooks/useInventory';
import { useCustomers } from '../../hooks/useCustomers';
import { useToast } from '../../hooks/useToast';

/**
 * SalesScreen (POS)
 *
 * Point of Sale checkout interface.
 * Optimized for rapid keyboard & mouse interaction, leveraging the 40Labs design foundation,
 * feature hooks, development API, and non-intrusive toast feedback.
 */
export const SalesScreen: React.FC = () => {
  const { toast } = useToast();
  const { items: inventoryItems, refetch: refetchInventory } = useInventory();
  const { customers } = useCustomers();

  const {
    cart,
    selectedCustomer,
    paymentMethod,
    discountAmount,
    heldSales,
    completedSales,
    users,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setSelectedCustomer,
    setPaymentMethod,
    setDiscountAmount,
    holdCurrentSale,
    resumeHeldSale,
    deleteHeldSale,
    checkout,
    isCreatingSale,
  } = useSales();

  const [manualEntry, setManualEntry] = React.useState<{ full_name: string; phone: string }>({
    full_name: '',
    phone: '',
  });
  const [customerPanelOpen, setCustomerPanelOpen] = React.useState(true);
  const [storePanelOpen, setStorePanelOpen] = React.useState(true);
  const [showNumpad, setShowNumpad] = React.useState(false);
  const [saveCustomer, setSaveCustomer] = React.useState(true);

  // Post-Checkout State & Receipt Modal State
  const [confirmedSale, setConfirmedSale] = React.useState<ConfirmedSaleData | null>(null);
  const [receiptModalData, setReceiptModalData] = React.useState<{
    saleId: string;
    date: string;
    customerLabel: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    total: number;
  } | null>(null);
  const [isReceiptModalOpen, setReceiptModalOpen] = React.useState(false);
  const [isHoldModalOpen, setHoldModalOpen] = React.useState(false);

  const dispensedUser = users[0] || { full_name: 'Pharmacy Staff' };

  const subtotal = React.useMemo(() => {
    return cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - discountAmount);
  const canConfirm = cart.length > 0;

  // Add item with toast feedback
  const handleAddToCart = React.useCallback(
    (item: MedicineWithInventory) => {
      const res = addToCart(item);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.warning(res.message);
      }
    },
    [addToCart, toast]
  );

  // Update quantity with toast feedback
  const handleQuantityChange = React.useCallback(
    (inventoryItemId: string, qty: number) => {
      const res = updateQuantity(inventoryItemId, qty);
      if (!res.success) {
        toast.warning(res.message);
      }
    },
    [updateQuantity, toast]
  );

  // Checkout process
  const handleConfirm = async () => {
    if (!canConfirm || isCreatingSale) return;

    const customerLabel = selectedCustomer?.full_name || manualEntry.full_name || 'Walk-in Customer';
    const customerPhone = selectedCustomer?.phone || manualEntry.phone || 'N/A';
    const itemSummary = cart.map((c) => `${c.quantity}x ${c.inventoryItem.medicine.name}`).join(', ');

    const receiptItems: ReceiptItem[] = cart.map((c) => ({
      name: c.inventoryItem.medicine.name,
      qty: c.quantity,
      price: c.unitPrice,
      total: c.quantity * c.unitPrice,
    }));

    const completed = await checkout({
      manualCustomer: manualEntry,
      saveCustomer,
    });

    if (!completed) {
      toast.error('Failed to complete sale. Please try again.');
      return;
    }

    const saleDate = new Date(completed.created_at).toLocaleString();

    setConfirmedSale({
      saleId: completed.id,
      customerLabel,
      phone: customerPhone,
      email: selectedCustomer?.email || '',
      service: dispensedUser.full_name,
      cost: completed.grand_total,
      description: itemSummary,
      date: saleDate,
    });

    setReceiptModalData({
      saleId: completed.id,
      date: saleDate,
      customerLabel,
      items: receiptItems,
      subtotal,
      tax: 0,
      total: completed.grand_total,
    });

    toast.success(`Sale #${completed.id.substring(0, 8)} confirmed! Total: TZS ${completed.grand_total.toLocaleString()}`);
    setManualEntry({ full_name: '', phone: '' });
  };

  const handleHoldSale = () => {
    const res = holdCurrentSale(manualEntry);
    if (res.success) {
      toast.info('Sale parked in held bills.');
      setManualEntry({ full_name: '', phone: '' });
    } else {
      toast.warning(res.message);
    }
  };

  const handleSendReportReset = () => {
    setConfirmedSale(null);
    setSelectedCustomer(null);
    setManualEntry({ full_name: '', phone: '' });
  };

  const handleDelete = () => {
    clearCart();
    setConfirmedSale(null);
    toast.info('Cart cleared.');
  };

  // Keyboard shortcut listener for fast POS entry
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter to confirm sale
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (canConfirm) handleConfirm();
      }
      // Esc to clear cart or reset post-checkout view
      if (e.key === 'Escape') {
        if (confirmedSale) {
          setConfirmedSale(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canConfirm, confirmedSale]);

  const cartLinesForList = React.useMemo(() => {
    return cart.map((c) => ({
      item: c.inventoryItem,
      quantity: c.quantity,
    }));
  }, [cart]);

  return (
    <PageViewport>
      {/* Header */}
      <PageHeader
        title="Point of Sale"
        subtitle="Process checkout sales, search stock, manage active cart, and print receipts."
      />

      {/* POS Toolbar */}
      <PageToolbar
        left={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="neutral"
              size="sm"
              leftIcon={<PauseCircle size={14} />}
              onClick={() => setHoldModalOpen(true)}
            >
              Held Bills
              {heldSales.length > 0 && (
                <Badge variant="primary" className="ml-1.5 px-1.5 py-0 text-[9px]">
                  {heldSales.length}
                </Badge>
              )}
            </Button>

            <IconButton
              icon={<Calculator size={14} />}
              label="Toggle Numpad"
              intent={showNumpad ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowNumpad(!showNumpad)}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="ghost"
              size="sm"
              leftIcon={<PlusCircle size={14} />}
              onClick={handleDelete}
            >
              New Sale
            </Button>

            <IconButton
              icon={<RefreshCw size={14} />}
              label="Refresh inventory"
              intent="ghost"
              size="sm"
              onClick={() => refetchInventory()}
            />
          </div>
        }
      />

      {/* Content Region */}
      <PageContent scrollable={false} padding="normal">
        <div className="relative flex gap-4 h-full w-full overflow-hidden">
          {/* Left Column Toggle when closed */}
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

          {/* Left Column - Customer & Receipt Panel */}
          <div
            className={`transition-all duration-200 overflow-hidden flex flex-col shrink-0 ${
              customerPanelOpen ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -ml-4'
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
              onSendReport={handleSendReportReset}
              onPrintReceipt={() => setReceiptModalOpen(true)}
              saveCustomer={saveCustomer}
              onSaveCustomerChange={setSaveCustomer}
              onToggleCollapse={() => setCustomerPanelOpen(false)}
            />
          </div>

          {/* Middle Column - Cart & Totals */}
          <div className="relative flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
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

            {/* Cart Items Region */}
            <div className="flex-1 min-h-0 overflow-hidden bg-panel-strong/40 rounded-card border border-border/50 p-3 elevation-inset relative flex flex-col gap-2">
              <SaleCartList
                lines={cartLinesForList}
                onQuantityChange={handleQuantityChange}
                onRemove={removeFromCart}
              />

              {/* Optional Floating Numpad Panel */}
              {showNumpad && (
                <div className="absolute bottom-3 right-3 z-30 w-56 shadow-2xl animate-in slide-in-from-bottom-2">
                  <Numpad
                    value={discountAmount ? String(discountAmount) : ''}
                    onChange={(val) => setDiscountAmount(Number(val) || 0)}
                    onConfirm={() => setShowNumpad(false)}
                  />
                </div>
              )}
            </div>

            {/* Totals & Checkout Bar */}
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
                onHold={cart.length > 0 ? handleHoldSale : undefined}
                disabled={!canConfirm}
                isProcessing={isCreatingSale}
              />
            </div>
          </div>

          {/* Right Column - Medicine Store Panel */}
          <div
            className={`transition-all duration-200 overflow-hidden flex flex-col shrink-0 ${
              storePanelOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 -ml-4'
            }`}
          >
            <MedicineSearchPanel
              medicines={inventoryItems}
              completedSales={completedSales}
              onAdd={handleAddToCart}
              onToggleCollapse={() => setStorePanelOpen(false)}
            />
          </div>
        </div>
      </PageContent>

      {/* Receipts Preview Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        saleData={receiptModalData}
      />

      {/* Held Bills Modal */}
      <HoldSalesModal
        isOpen={isHoldModalOpen}
        onClose={() => setHoldModalOpen(false)}
        heldSales={heldSales}
        onResume={resumeHeldSale}
        onDelete={deleteHeldSale}
      />
    </PageViewport>
  );
};
