// [PHASE: marketplace-preview — Data foundation]
import {
  MarketplaceSupplier,
  CatalogProduct,
  MarketplaceSupplierCart,
  MarketplaceCartLine,
  MarketplacePurchaseOrder,
  MarketplacePurchaseOrderStatus,
} from '@40labs/types';

export interface SupplierRepo {
  list(): Promise<MarketplaceSupplier[]>;
  get(businessId: string): Promise<MarketplaceSupplier | null>;
  search(q: string): Promise<MarketplaceSupplier[]>;
  follow(supplierBusinessId: string): Promise<void>;
  unfollow(supplierBusinessId: string): Promise<void>;
  listFollowed(): Promise<MarketplaceSupplier[]>;
}

export interface CatalogRepo {
  searchProducts(q: string, opts?: { supplierId?: string }): Promise<CatalogProduct[]>;
  listBySupplier(supplierBusinessId: string): Promise<CatalogProduct[]>;
  findAlternatives(medicineKey: string, excludeSupplierId: string): Promise<CatalogProduct[]>;
}

export interface CartRepo {
  getCart(supplierBusinessId: string): Promise<MarketplaceSupplierCart>;
  upsertLine(supplierBusinessId: string, line: MarketplaceCartLine): Promise<MarketplaceSupplierCart>;
  removeLine(supplierBusinessId: string, productId: string): Promise<MarketplaceSupplierCart>;
  clear(supplierBusinessId: string): Promise<void>;
}

export interface OrderRepo {
  createDraft(
    supplierBusinessId: string,
    cart: MarketplaceSupplierCart,
    channel?: 'whatsapp' | 'inapp' | 'cloud'
  ): Promise<MarketplacePurchaseOrder>;
  listByStatus(status: MarketplacePurchaseOrderStatus | 'pending' | 'recently'): Promise<MarketplacePurchaseOrder[]>;
  listBySupplier(supplierBusinessId: string): Promise<MarketplacePurchaseOrder[]>;
  markStatus(orderId: string, status: MarketplacePurchaseOrderStatus): Promise<MarketplacePurchaseOrder>;
}
