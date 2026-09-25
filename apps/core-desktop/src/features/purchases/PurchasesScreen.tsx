import React from 'react';
import { PageViewport, PageHeader, PageContent, Button } from '@40labs/ui-components';
import { ChevronLeft } from 'lucide-react';
import { SupplierSearchPanel } from './components/SupplierSearchPanel';
import { PurchaseHistoryPanel } from './components/PurchaseHistoryPanel';
import { SupplierStorefront } from './components/SupplierStorefront';
import { usePurchases } from '../../hooks/usePurchases';

export const PurchasesScreen: React.FC = () => {
  const { selectedSupplierId, setSelectedSupplierId } = usePurchases();

  return (
    <PageViewport>
      <PageHeader
        title="Purchases & Suppliers"
        subtitle="Browse supplier marketplace, issue purchase orders, and track order fulfillment."
        actions={
          selectedSupplierId ? (
            <Button
              intent="neutral"
              leftIcon={<ChevronLeft size={16} />}
              onClick={() => setSelectedSupplierId(null)}
            >
              Back to Suppliers
            </Button>
          ) : undefined
        }
      />

      <PageContent scrollable={false} padding="normal">
        {selectedSupplierId ? (
          <SupplierStorefront
            supplierId={selectedSupplierId}
            onBack={() => setSelectedSupplierId(null)}
          />
        ) : (
          <div className="flex flex-row gap-6 w-full h-full overflow-hidden">
            {/* Search panel placed on the left */}
            <div className="w-1/3 min-w-[320px] h-full overflow-y-auto custom-scrollbar">
              <SupplierSearchPanel
                selectedSupplierId={selectedSupplierId}
                onSelectSupplier={(id) => setSelectedSupplierId(id)}
              />
            </div>

            {/* Purchase history panel placed on the right */}
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
              <PurchaseHistoryPanel />
            </div>
          </div>
        )}
      </PageContent>
    </PageViewport>
  );
};
