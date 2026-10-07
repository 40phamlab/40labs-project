import React from 'react';
import { TabContainer } from '../../components/TabContainer';
import { SupplierSearchPanel } from './components/SupplierSearchPanel';
import { PurchaseHistoryPanel } from './components/PurchaseHistoryPanel';
import { SupplierStorefront } from './components/SupplierStorefront';
import { usePurchases } from '../../hooks/usePurchases';

export const PurchasesScreen: React.FC = () => {
  const { selectedSupplierId, setSelectedSupplierId } = usePurchases();

  return (
    <TabContainer>
      {selectedSupplierId ? (
        <SupplierStorefront
          supplierId={selectedSupplierId}
          onBack={() => setSelectedSupplierId(null)}
        />
      ) : (
        <div className="flex flex-row gap-3.5 flex-1 min-h-0 w-full overflow-hidden">
          {/* Search panel placed on the left */}
          <div className="w-[280px] lg:w-[320px] shrink-0 h-full overflow-y-auto custom-scrollbar">
            <SupplierSearchPanel
              selectedSupplierId={selectedSupplierId}
              onSelectSupplier={(id) => setSelectedSupplierId(id)}
            />
          </div>

          {/* Purchase history panel placed on the right */}
          <div className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto custom-scrollbar">
            <PurchaseHistoryPanel />
          </div>
        </div>
      )}
    </TabContainer>
  );
};
