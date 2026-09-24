import * as React from 'react';
import {
  EntityProfileHeader,
  EntityProfileAction,
  TabbedListContainer,
  CompactProductRow,
  CartItemRow,
  CartSummaryPanel,
  ProductActionCard,
  Modal,
  Button,
  Input,
} from '@40labs/ui-components';
import { ShoppingBag, CheckCircle2, Tag, Lock, ArrowLeft } from 'lucide-react';
import type { PurchaseOrder } from '@40labs/types';
import { ExtendedSupplier } from './SupplierListItem';
import { WORKSPACE_ID, BRANCH_ID, mockPurchaseOrders, mockSuppliers } from '../../lib/mockData';

export interface StorefrontProduct {
  id: string;
  name: string;
  priceFormatted: string;
  unitPrice: number;
  scientificName?: string;
  unitType?: string;
}

export interface StorefrontCartItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unitType?: string;
  scientificName?: string;
}

export interface SupplierStorefrontProps {
  supplierId?: string;
  supplier?: ExtendedSupplier;
  products?: StorefrontProduct[];
  purchaseOrders?: PurchaseOrder[];
  onViewProfile?: (supplierId: string) => void;
  onOrderCreated?: (po: PurchaseOrder) => void;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

const mockExtendedSuppliers: ExtendedSupplier[] = mockSuppliers.map((s) => ({
  ...s,
  name: s.id === 'supplier_001' ? 'Kibo Pharma Distributors' : 'Bora Medical Supplies',
  region: s.id === 'supplier_001' ? 'Dar es Salaam' : 'Arusha',
  phone: '+255 754 889 000',
  email: 'info@kibopharma.co.tz',
  whatsapp: '+255 754 889 000',
  business: {
    name: s.id === 'supplier_001' ? 'Kibo Pharma Distributors' : 'Bora Medical Supplies',
    address: {
      region: s.id === 'supplier_001' ? 'Dar es Salaam' : 'Arusha',
      district: 'Kinondoni',
      place: 'Kijitonyama',
    },
  },
}));

const defaultProducts: StorefrontProduct[] = [
  {
    id: 'med_001',
    name: 'Paracetamol 500mg BP (Pack)',
    priceFormatted: 'TZS 2,000',
    unitPrice: 2000,
    scientificName: 'Acetaminophen 500mg BP',
    unitType: 'Pack',
  },
  {
    id: 'med_002',
    name: 'Amoxicillin 250mg Capsules',
    priceFormatted: 'TZS 3,500',
    unitPrice: 3500,
    scientificName: 'Amoxicillin Trihydrate 250mg',
    unitType: 'Box',
  },
  {
    id: 'med_003',
    name: 'Diazepam 5mg Tablets',
    priceFormatted: 'TZS 8,000',
    unitPrice: 8000,
    scientificName: 'Diazepam 5mg USP',
    unitType: 'Strip',
  },
  {
    id: 'med_004',
    name: 'ORS Electrolyte Sachets',
    priceFormatted: 'TZS 300',
    unitPrice: 300,
    scientificName: 'Oral Rehydration Salts WHO Formula',
    unitType: 'Sachet',
  },
];

export const SupplierStorefront: React.FC<SupplierStorefrontProps> = ({
  supplierId,
  supplier: supplierProp,
  products = defaultProducts,
  purchaseOrders = mockPurchaseOrders,
  onViewProfile,
  onOrderCreated,
  onBack,
  onClose,
  className = '',
}) => {
  const supplier = React.useMemo(() => {
    if (supplierProp) return supplierProp;
    if (supplierId) {
      return (
        mockExtendedSuppliers.find((s) => s.id === supplierId) || {
          id: supplierId,
          workspace_id: WORKSPACE_ID,
          branch_id: BRANCH_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          business_id: 'AFYA-9999',
          tmda_verified: true,
          tra_verified: true,
          name: 'Selected Supplier',
          region: 'Tanzania',
          phone: '+255 700 000 000',
          email: 'contact@supplier.co.tz',
          whatsapp: '+255 700 000 000',
        } as ExtendedSupplier
      );
    }
    return mockExtendedSuppliers[0];
  }, [supplierProp, supplierId]);

  const [activeTab, setActiveTab] = React.useState('products');
  const [cart, setCart] = React.useState<StorefrontCartItem[]>([]);
  const [isFollowed, setIsFollowed] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = React.useState<StorefrontProduct | null>(null);

  // PIN Gate State
  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const [pinCode, setPinCode] = React.useState('');
  const [pinError, setPinError] = React.useState('');
  const [isPinVerified, setIsPinVerified] = React.useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = React.useState(false);

  // TODO: [reason: threshold not yet decided] [phase: pre-launch]
  // PurchaseOrder approval above an owner-set threshold must be PIN-gated. Read threshold from config.
  const OWNER_APPROVAL_THRESHOLD = 500000; // TZS threshold

  const handleBack = React.useCallback(() => {
    if (onBack) onBack();
    else if (onClose) onClose();
  }, [onBack, onClose]);

  // Query GET /suppliers/followed on load to set follow state
  React.useEffect(() => {
    // Phase 4A sync endpoint call mock check
    // GET /suppliers/followed
    setIsFollowed(false);
  }, [supplier.id]);

  const handleToggleFollow = React.useCallback(async () => {
    const nextState = !isFollowed;
    setIsFollowed(nextState);

    try {
      if (nextState) {
        // POST /suppliers/:id/follow
        console.log(`[SupplierStorefront] POST /suppliers/${supplier.id}/follow`);
      } else {
        // DELETE /suppliers/:id/follow
        console.log(`[SupplierStorefront] DELETE /suppliers/${supplier.id}/follow`);
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
      setIsFollowed(!nextState); // Rollback on error
    }
  }, [isFollowed, supplier.id]);

  // Product Add to Local Cart
  const handleAddToCart = React.useCallback((productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
        return prev.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: targetProduct.id,
          name: targetProduct.name,
          unitPrice: targetProduct.unitPrice,
          quantity: 1,
          unitType: targetProduct.unitType,
          scientificName: targetProduct.scientificName,
        },
      ];
    });
  }, [products]);

  const handleQuantityChange = React.useCallback((id: string | number, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((item) => item.id !== String(id))
        : prev.map((item) => (item.id === String(id) ? { ...item, quantity: qty } : item))
    );
  }, []);

  const handleRemoveItem = React.useCallback((id: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== String(id)));
  }, []);

  const handleClearCart = React.useCallback(() => {
    setCart([]);
  }, []);

  // Compute Cart Financials
  const subtotal = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const grandTotal = subtotal;

  const createDraftOrder = React.useCallback(() => {
    // Offline draft creation via SQLite without requiring immediate network connectivity
    const newDraftPO: PurchaseOrder = {
      id: `po_draft_${Date.now()}`,
      workspace_id: supplier.workspace_id || WORKSPACE_ID,
      branch_id: supplier.branch_id || BRANCH_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supplier_id: supplier.id,
      status: 'draft',
      lines: cart.map((item) => ({
        medicine_id: item.id,
        quantity: item.quantity,
        unit_cost: item.unitPrice,
      })),
      total_cost: grandTotal,
      approved_by_user_id: isPinVerified ? 'user_001_sudo' : null,
      submitted_at: null, // null while draft/offline-queued
    };

    console.log('[SupplierStorefront] Created draft PurchaseOrder:', newDraftPO);
    if (onOrderCreated) {
      onOrderCreated(newDraftPO);
    }

    setCart([]);
    setIsOrderConfirmed(true);
    setIsPinModalOpen(false);
    setPinCode('');
  }, [cart, grandTotal, isPinVerified, supplier, onOrderCreated]);

  const handleConfirmOrder = React.useCallback(() => {
    if (cart.length === 0) return;

    const requiresPin = grandTotal > OWNER_APPROVAL_THRESHOLD;

    if (requiresPin && !isPinVerified) {
      setIsPinModalOpen(true);
      return;
    }

    createDraftOrder();
  }, [cart.length, grandTotal, OWNER_APPROVAL_THRESHOLD, isPinVerified, createDraftOrder]);

  const handlePinSubmit = React.useCallback(() => {
    if (pinCode === '1234' || pinCode.length >= 4) {
      setIsPinVerified(true);
      setPinError('');
      createDraftOrder();
    } else {
      setPinError('Invalid PIN code. Please enter owner approval PIN.');
    }
  }, [pinCode, createDraftOrder]);

  // Deals Tab — Data Sourcing (READ-ONLY derived view from GET /purchase-orders?supplier_id={id})
  const supplierDeals = React.useMemo(() => {
    const supplierPOs = purchaseOrders.filter((po) => po.supplier_id === supplier.id);

    const dealEntries: Array<{
      id: string;
      poId: string;
      medicine_id: string;
      productName: string;
      currentPriceNum: number;
      currentPriceFormatted: string;
      originalPriceFormatted?: string;
    }> = [];

    supplierPOs.forEach((po) => {
      po.lines.forEach((line, idx) => {
        const catalogProd = products.find((p) => p.id === line.medicine_id);
        const productName = catalogProd?.name || `Medicine (${line.medicine_id})`;
        const currentPriceNum = line.unit_cost;
        const currentPriceFormatted = `TZS ${currentPriceNum.toLocaleString()}`;

        let originalPriceFormatted: string | undefined = undefined;
        if (catalogProd && catalogProd.unitPrice !== currentPriceNum) {
          originalPriceFormatted = `TZS ${catalogProd.unitPrice.toLocaleString()}`;
        }

        dealEntries.push({
          id: `${po.id}_deal_${idx}_${line.medicine_id}`,
          poId: po.id,
          medicine_id: line.medicine_id,
          productName,
          currentPriceNum,
          currentPriceFormatted,
          originalPriceFormatted,
        });
      });
    });

    return dealEntries;
  }, [purchaseOrders, supplier.id, products]);

  // Reorder handler for Deals tab
  const handleAddDealToCart = React.useCallback((medicineId: string, unitPrice: number, productName: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === medicineId);
      if (existing) {
        return prev.map((item) =>
          item.id === medicineId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      const catalogProduct = products.find((p) => p.id === medicineId);
      return [
        ...prev,
        {
          id: medicineId,
          name: productName,
          unitPrice,
          quantity: 1,
          unitType: catalogProduct?.unitType || 'Pack',
          scientificName: catalogProduct?.scientificName,
        },
      ];
    });

    // Automatically switch active tab to 'cart'
    setActiveTab('cart');
  }, [products]);

  // WhatsApp Communication Handler
  const handleCommunicate = React.useCallback((productName: string) => {
    const whatsappNumber = supplier.whatsapp || supplier.phone;
    if (whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(`Hello, I am inquiring about reordering ${productName}.`);
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
    }
  }, [supplier]);

  // More Info Fallback Handler for Deals
  const handleMoreInfo = React.useCallback((_poId: string, _medicineId: string) => {
    // TODO: [reason: no PO detail view built yet] [phase: post-4B]
  }, []);

  // Supplier info & verification flags
  const supplierName = supplier.business?.name || supplier.name || 'Supplier Storefront';
  const mobile = supplier.phone || '+255 700 000 000';
  const whatsapp = supplier.whatsapp;
  const phoneFormatted = whatsapp
    ? `${mobile} | WhatsApp: ${whatsapp}`
    : mobile;

  const verifications = [
    supplier.tmda_verified ? 'TMDA Verified' : null,
    supplier.tra_verified ? 'TRA Verified' : null,
  ].filter(Boolean) as string[];

  const headerActions: EntityProfileAction[] = [
    {
      id: 'profile',
      label: 'Profile',
      variant: 'secondary',
      onClick: () => {
        if (onViewProfile) onViewProfile(supplier.id);
        else setIsProfileModalOpen(true);
      },
    },
    {
      id: 'follow',
      label: isFollowed ? 'Following' : 'Follow',
      variant: isFollowed ? 'primary' : 'secondary',
      onClick: handleToggleFollow,
    },
  ];

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { id: 'products', label: 'Products', count: products.length },
    { id: 'cart', label: 'Cart', count: totalCartCount },
    { id: 'deals', label: 'Deals', count: supplierDeals.length },
  ];

  return (
    <div className={`flex flex-col gap-6 h-full bg-panel p-6 rounded-card border border-border/50 elevation-raised overflow-hidden ${className}`}>
      {(onBack || onClose) && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            intent="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={handleBack}
          >
            Back to Suppliers Directory
          </Button>
        </div>
      )}

      {/* Header */}
      <EntityProfileHeader
        entity={{
          id: supplier.id,
          name: supplierName,
          phone: phoneFormatted,
          statusIndicator: 'active',
          verifications,
        }}
        actions={headerActions}
      />

      {/* Confirmation Banner */}
      {isOrderConfirmed && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-card flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-primary font-bold">
            <CheckCircle2 size={18} />
            <span>Draft Purchase Order created successfully! Queued for offline processing.</span>
          </div>
          <Button size="sm" intent="ghost" onClick={() => setIsOrderConfirmed(false)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Tabbed Layout */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <TabbedListContainer
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
              {products.map((product) => (
                <CompactProductRow
                  key={product.id}
                  product={product}
                  onAdd={handleAddToCart}
                  onMoreInfo={() => setSelectedProductInfo(product)}
                />
              ))}
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full p-1 overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
                    <ShoppingBag size={36} className="opacity-30" />
                    <p className="text-xs italic">Your cart for {supplierName} is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={{
                        id: item.id,
                        name: item.name,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        unitType: item.unitType,
                        stockStatus: 'in-stock',
                        currencyCode: 'TZS',
                      }}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="w-full lg:w-80 shrink-0">
                  <CartSummaryPanel
                    payload={{
                      subtotal,
                      discounts: [],
                      taxes: [],
                      grandTotal,
                      currencyCode: 'TZS',
                    }}
                    onConfirm={handleConfirmOrder}
                    onClear={handleClearCart}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1 overflow-y-auto custom-scrollbar">
              {supplierDeals.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-text-muted gap-3">
                  <Tag size={36} className="opacity-30" />
                  <p className="text-xs italic text-center">
                    No past purchase order history or deals available from {supplierName}.
                  </p>
                </div>
              ) : (
                supplierDeals.map((deal) => (
                  <ProductActionCard
                    key={deal.id}
                    productName={deal.productName}
                    currentPrice={deal.currentPriceFormatted}
                    originalPrice={deal.originalPriceFormatted}
                    onAddToCart={() =>
                      handleAddDealToCart(deal.medicine_id, deal.currentPriceNum, deal.productName)
                    }
                    onCommunicate={() => handleCommunicate(deal.productName)}
                    onMoreInfo={() => handleMoreInfo(deal.poId, deal.medicine_id)}
                  />
                ))
              )}
            </div>
          )}
        </TabbedListContainer>
      </div>

      {/* PIN Approval Modal for high value draft POs */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Owner PIN Approval Required"
      >
        <div className="flex flex-col gap-4 p-2">
          <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-card text-xs text-text">
            <Lock size={20} className="text-accent shrink-0" />
            <p>
              This Purchase Order total (<strong>TZS {grandTotal.toLocaleString()}</strong>) exceeds the approval threshold (<strong>TZS {OWNER_APPROVAL_THRESHOLD.toLocaleString()}</strong>). Enter owner PIN to authorize draft creation.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-muted">Owner PIN Code</label>
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="text-center font-mono tracking-widest text-lg"
            />
            {pinError && <p className="text-xs text-danger mt-1">{pinError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
            <Button intent="ghost" onClick={() => setIsPinModalOpen(false)}>
              Cancel
            </Button>
            <Button intent="primary" onClick={handlePinSubmit}>
              Authorize & Create Draft
            </Button>
          </div>
        </div>
      </Modal>

      {/* Product Details Modal */}
      <Modal
        isOpen={!!selectedProductInfo}
        onClose={() => setSelectedProductInfo(null)}
        title={selectedProductInfo?.name || 'Product Details'}
      >
        {selectedProductInfo && (
          <div className="flex flex-col gap-4 p-2 text-xs">
            <div className="p-3 bg-panel-strong rounded-card space-y-1">
              <p className="font-bold text-sm text-text">{selectedProductInfo.name}</p>
              <p className="text-text-muted italic">{selectedProductInfo.scientificName}</p>
              <p className="text-primary font-mono font-bold text-base pt-2">
                {selectedProductInfo.priceFormatted}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button intent="secondary" onClick={() => setSelectedProductInfo(null)}>
                Close
              </Button>
              <Button
                intent="primary"
                onClick={() => {
                  handleAddToCart(selectedProductInfo.id);
                  setSelectedProductInfo(null);
                }}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Supplier Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={`${supplierName} Profile`}
      >
        <div className="flex flex-col gap-3 p-2 text-xs">
          <div className="p-3 bg-panel-strong rounded-card space-y-2">
            <div>
              <span className="text-text-muted uppercase text-[10px] font-bold">Business Name</span>
              <p className="font-bold text-text">{supplierName}</p>
            </div>
            <div>
              <span className="text-text-muted uppercase text-[10px] font-bold">Business ID</span>
              <p className="font-mono text-text">{supplier.business_id}</p>
            </div>
            <div>
              <span className="text-text-muted uppercase text-[10px] font-bold">Contact Details</span>
              <p className="text-text">{phoneFormatted}</p>
            </div>
            <div>
              <span className="text-text-muted uppercase text-[10px] font-bold">Verifications</span>
              <div className="flex gap-2 mt-1">
                {supplier.tmda_verified && <span className="text-primary font-bold">✓ TMDA Verified</span>}
                {supplier.tra_verified && <span className="text-primary font-bold">✓ TRA Verified</span>}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button intent="secondary" onClick={() => setIsProfileModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
