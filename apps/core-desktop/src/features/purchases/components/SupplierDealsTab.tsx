// [PHASE: marketplace-preview — Storefront scroll + space]
import * as React from 'react';
import { Tag } from 'lucide-react';
import { ProductActionCard } from './ProductActionCard';

export interface SupplierDealEntry {
  id: string;
  poId: string;
  medicine_id: string;
  productName: string;
  currentPriceNum: number;
  currentPriceFormatted: string;
  originalPriceFormatted?: string;
}

export interface SupplierDealsTabProps {
  supplierName: string;
  deals: SupplierDealEntry[];
  onAddDealToCart: (medicineId: string, unitPrice: number, productName: string) => void;
  onCommunicate: (productName: string) => void;
  onMoreInfo: (poId: string, medicineId: string) => void;
}

export const SupplierDealsTab: React.FC<SupplierDealsTabProps> = ({
  supplierName,
  deals,
  onAddDealToCart,
  onCommunicate,
  onMoreInfo,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1 overflow-y-auto custom-scrollbar flex-1 min-h-0">
      {deals.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-text-muted gap-3">
          <Tag size={36} className="opacity-30" />
          <p className="text-xs italic text-center">
            No past purchase order history or deals available from {supplierName}. / Hakuna historia ya oda za ununuzi.
          </p>
        </div>
      ) : (
        deals.map((deal) => (
          <ProductActionCard
            key={deal.id}
            productName={deal.productName}
            currentPrice={deal.currentPriceFormatted}
            originalPrice={deal.originalPriceFormatted}
            onAddToCart={() =>
              onAddDealToCart(deal.medicine_id, deal.currentPriceNum, deal.productName)
            }
            onCommunicate={() => onCommunicate(deal.productName)}
            onMoreInfo={() => onMoreInfo(deal.poId, deal.medicine_id)}
          />
        ))
      )}
    </div>
  );
};
