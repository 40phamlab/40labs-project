// [PHASE: marketplace-preview]
import * as React from 'react';
import { TabbedListContainer, Modal, Button } from '@40labs/ui-components';
import { CheckCircle2 } from 'lucide-react';
import type { PurchaseOrder } from '@40labs/types';
import { ExtendedSupplier } from './SupplierListItem';
import { usePurchases } from '../../../hooks/usePurchases';
import { useStepUp } from '../../../features/auth/stepup/StepUpProvider';
import { pharmaciesApi } from '../../../api';
import { SupplierStorefrontHeader } from './SupplierStorefrontHeader';
import { SupplierProductsTab } from './SupplierProductsTab';
import { SupplierCartTab } from './SupplierCartTab';
import { SupplierDealsTab, SupplierDealEntry } from './SupplierDealsTab';

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
  purchaseOrders: purchaseOrdersProp,
  onViewProfile,
  onOrderCreated,
  onBack,
  onClose,
  className = '',
}) => {
  const {
    purchaseOrders: fetchedPOs,
    suppliers: fetchedSuppliers,
    createPurchaseOrder,
    updatePurchaseOrder,
  } = usePurchases();

  const { requestStepUp } = useStepUp();

  const purchaseOrders = React.useMemo(() => {
    return purchaseOrdersProp || fetchedPOs;
  }, [purchaseOrdersProp, fetchedPOs]);

  const supplier = React.useMemo(() => {
    if (supplierProp) return supplierProp;

    const baseSuppliers = fetchedSuppliers;
    const extendedSuppliers: ExtendedSupplier[] = baseSuppliers.map((s) => ({
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

    if (supplierId) {
      return (
        extendedSuppliers.find((s) => s.id === supplierId) || {
          id: supplierId,
          workspace_id: pharmaciesApi.getBusiness().id || 'ws_dev_001',
          branch_id: 'br_dev_001',
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
    return extendedSuppliers[0];
  }, [supplierProp, fetchedSuppliers, supplierId]);

  const [activeTab, setActiveTab] = React.useState('products');
  const [cart, setCart] = React.useState<StorefrontCartItem[]>([]);
  const [isFollowed, setIsFollowed] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = React.useState<StorefrontProduct | null>(null);
  const [isOrderConfirmed, setIsOrderConfirmed] = React.useState(false);

  const OWNER_APPROVAL_THRESHOLD = 500000;

  React.useEffect(() => {
    setIsFollowed(false);
  }, [supplier?.id]);

  const handleToggleFollow = React.useCallback(() => {
    setIsFollowed((prev) => !prev);
  }, []);

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

  const subtotal = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const grandTotal = subtotal;

  const executeCreateOrder = React.useCallback(async (grantToken?: string) => {
    if (!supplier) return;

    const newDraftPO = await createPurchaseOrder(
      supplier.id,
      cart.map((item) => ({
        medicine_id: item.id,
        quantity: item.quantity,
        unit_cost: item.unitPrice,
      }))
    );

    if (grantToken && newDraftPO) {
      await updatePurchaseOrder(newDraftPO.id, { approved_by_user_id: 'user_001_sudo' });
    }

    if (onOrderCreated && newDraftPO) {
      onOrderCreated(newDraftPO);
    }

    setCart([]);
    setIsOrderConfirmed(true);
  }, [cart, supplier, createPurchaseOrder, updatePurchaseOrder, onOrderCreated]);

  const handleConfirmOrder = React.useCallback(async () => {
    if (cart.length === 0 || !supplier) return;

    const requiresPin = grandTotal > OWNER_APPROVAL_THRESHOLD;

    if (requiresPin) {
      await requestStepUp(
        async (token) => {
          await executeCreateOrder(token);
        },
        'purchases.approve'
      );
    } else {
      await executeCreateOrder();
    }
  }, [cart.length, grandTotal, OWNER_APPROVAL_THRESHOLD, requestStepUp, executeCreateOrder, supplier]);

  const supplierDeals = React.useMemo(() => {
    if (!supplier) return [];
    const supplierPOs = purchaseOrders.filter((po) => po.supplier_id === supplier.id);
    const dealEntries: SupplierDealEntry[] = [];

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
  }, [purchaseOrders, supplier, products]);

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

    setActiveTab('cart');
  }, [products]);

  const handleCommunicate = React.useCallback((productName: string) => {
    if (!supplier) return;
    const whatsappNumber = supplier.whatsapp || supplier.phone;
    if (whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(`Hello, I am inquiring about reordering ${productName}.`);
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
    }
  }, [supplier]);

  if (!supplier) return null;

  const supplierName = supplier.business?.name || supplier.name || 'Supplier Storefront';
  const mobile = supplier.phone || '+255 700 000 000';
  const whatsapp = supplier.whatsapp;
  const phoneFormatted = whatsapp ? `${mobile} | WhatsApp: ${whatsapp}` : mobile;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { id: 'products', label: 'Products', count: products.length },
    { id: 'cart', label: 'Cart', count: totalCartCount },
    { id: 'deals', label: 'Deals', count: supplierDeals.length },
  ];

  return (
    <div className={`flex flex-col gap-3.5 h-full bg-panel p-4 rounded-card border border-border/50 elevation-raised overflow-hidden ${className}`}>
      <SupplierStorefrontHeader
        supplier={supplier}
        supplierName={supplierName}
        phoneFormatted={phoneFormatted}
        isFollowed={isFollowed}
        onBack={onBack}
        onClose={onClose}
        onToggleFollow={handleToggleFollow}
        onViewProfile={() => {
          if (onViewProfile) onViewProfile(supplier.id);
          else setIsProfileModalOpen(true);
        }}
      />

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

      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        <TabbedListContainer
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
          scrollable={activeTab !== 'cart'}
        >
          {activeTab === 'products' && (
            <SupplierProductsTab
              products={products}
              onAddToCart={handleAddToCart}
              onMoreInfo={(prod) => setSelectedProductInfo(prod)}
            />
          )}

          {activeTab === 'cart' && (
            <SupplierCartTab
              cart={cart}
              supplierName={supplierName}
              subtotal={subtotal}
              grandTotal={grandTotal}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onConfirmOrder={handleConfirmOrder}
            />
          )}

          {activeTab === 'deals' && (
            <SupplierDealsTab
              supplierName={supplierName}
              deals={supplierDeals}
              onAddDealToCart={handleAddDealToCart}
              onCommunicate={handleCommunicate}
              onMoreInfo={() => {}}
            />
          )}
        </TabbedListContainer>
      </div>

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
