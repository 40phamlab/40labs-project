// [PHASE: marketplace-preview — Data foundation]

export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface MarketplaceSupplier {
  businessId: `AFYA-${string}`;
  name: string;
  logoUrl?: string;
  verification: {
    verified40Labs: boolean;
    tmda: boolean;
    tra: boolean;
  };
  phones: string[];
  email?: string;
  location: {
    city: string;
    region: string;
    label: string;
  };
  availability: {
    openTime: string;
    closeTime: string;
    days: Day[];
  };
  flags: {
    ePharmacy: boolean;
    education: boolean;
    delivery: boolean;
  };
  services: {
    id: string;
    title: string;
    blurb: string;
  }[];
}

export interface CatalogProduct {
  id: string;
  supplierBusinessId: string;
  name: string;
  genericName: string;
  form: string;
  packSize: string;
  unitPriceTzs: number;
  oldUnitPriceTzs?: number;
  stock: 'in' | 'low' | 'out';
  medicineKey: string; // normalized generic+strength+form, used for alternatives matching
  mappedMedicineId?: string;
}

export interface MarketplaceCartLine {
  productId: string;
  qty: number;
  unitPriceTzsSnapshot: number;
}

export interface MarketplaceSupplierCart {
  id: string;
  supplierBusinessId: string;
  lines: MarketplaceCartLine[];
}

export type MarketplacePurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'completed' | 'cancelled';

export interface MarketplacePurchaseOrderLine {
  productId: string;
  qty: number;
  unitPriceTzsSnapshot: number;
  name?: string;
}

export interface MarketplacePurchaseOrder {
  id: string; // uuid, doubles as idempotency key
  buyerBusinessId: string;
  sellerBusinessId: string;
  status: MarketplacePurchaseOrderStatus;
  lines: MarketplacePurchaseOrderLine[];
  totalTzs: number;
  channel: 'whatsapp' | 'inapp' | 'cloud';
  createdAt: string;
  sentAt?: string;
  updatedAt: string;
}
