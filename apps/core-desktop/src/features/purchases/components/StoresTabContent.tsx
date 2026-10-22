// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { Supplier } from '@40labs/types';
import { SupplierCard } from './SupplierCard';
import { Store } from 'lucide-react';

export interface StoresTabContentProps {
  followedSuppliers: Supplier[];
  onOpenSupplier: (supplierId: string) => void;
  onUnfollowSupplier: (supplierId: string) => void;
}

export const StoresTabContent: React.FC<StoresTabContentProps> = ({
  followedSuppliers,
  onOpenSupplier,
  onUnfollowSupplier,
}) => {
  if (followedSuppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted gap-3">
        <Store size={40} className="opacity-30" />
        <p className="text-xs italic max-w-sm">
          Follow suppliers from search to see them here / Fuata wasambazaji kutoka utafutaji ili kuwaona hapa.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 overflow-y-auto custom-scrollbar p-1">
      {followedSuppliers.map((supplier) => (
        <SupplierCard
          key={supplier.businessId}
          supplier={supplier}
          onOpen={onOpenSupplier}
          onUnfollow={onUnfollowSupplier}
        />
      ))}
    </div>
  );
};
