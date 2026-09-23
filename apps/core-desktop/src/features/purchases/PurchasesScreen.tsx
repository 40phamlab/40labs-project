import React, { useState } from 'react';
import { SupplierSearchPanel } from './SupplierSearchPanel';
import { PurchaseHistoryPanel } from './PurchaseHistoryPanel';
import { SupplierStorefront } from './SupplierStorefront';

export const PurchasesScreen: React.FC = () => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  if (selectedSupplierId) {
    return (
      <SupplierStorefront
        supplierId={selectedSupplierId}
        onBack={() => setSelectedSupplierId(null)}
      />
    );
  }

  return (
    <div className="flex flex-row gap-6 w-full h-full p-6">
      {/* Search panel placed on the left */}
      <div className="w-1/3 min-w-[320px]">
        <SupplierSearchPanel
          onSelectSupplier={(id) => setSelectedSupplierId(id)}
        />
      </div>

      {/* Purchase history panel placed on the right */}
      <div className="flex-1">
        <PurchaseHistoryPanel />
      </div>
    </div>
  );
};
