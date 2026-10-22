// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { TabContainer } from '../../components/TabContainer';
import { SupplierLeftPanel } from './components/SupplierLeftPanel';
import { PurchasesTabs } from './components/PurchasesTabs';
import { StoresTabContent } from './components/StoresTabContent';
import { OrderList } from './components/OrderList';
import { OrderDetailDrawer } from './components/OrderDetailDrawer';
import { SupplierStorefront } from './components/SupplierStorefront';
import { usePurchasesUiStore, PurchasesTabId } from './store/purchasesUi.slice';
import { useSuppliersQuery, useFollowedSuppliersQuery, useOrdersQuery, useMarketplaceMutations } from './hooks/usePurchasesMarketplace';

export const PurchasesScreen: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedSupplierId,
    setSelectedSupplierId,
    searchText,
    setSearchText,
    selectedOrderId,
    setSelectedOrderId,
    isDrawerOpen,
    setDrawerOpen,
  } = usePurchasesUiStore();

  const { data: allSuppliers = [] } = useSuppliersQuery(searchText);
  const { data: followedSuppliers = [] } = useFollowedSuppliersQuery();
  const { data: recentlyOrders = [] } = useOrdersQuery('recently');
  const { data: pendingOrders = [] } = useOrdersQuery('pending');
  const { data: completedOrders = [] } = useOrdersQuery('completed');

  const { toggleFollow, updateOrderStatus } = useMarketplaceMutations();

  const selectedOrder = [...recentlyOrders, ...pendingOrders, ...completedOrders].find((o) => o.id === selectedOrderId) || null;
  const selectedSupplierObj = allSuppliers.find((s) => s.businessId === selectedSupplierId) || null;

  const counts = {
    stores: followedSuppliers.length,
    recently: recentlyOrders.length,
    pending: pendingOrders.length,
    completed: completedOrders.length,
  };

  const handleUnfollow = React.useCallback(async (supplierBusinessId: string) => {
    await toggleFollow(supplierBusinessId, false);
  }, [toggleFollow]);

  const handleOpenStore = React.useCallback((supplierBusinessId: string) => {
    setSelectedSupplierId(supplierBusinessId);
  }, [setSelectedSupplierId]);

  return (
    <TabContainer>
      <div className="flex flex-row gap-3.5 flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Search & Directory Panel */}
        <div className="w-[280px] lg:w-[320px] shrink-0 h-full overflow-y-auto custom-scrollbar">
          <SupplierLeftPanel
            suppliers={allSuppliers}
            selectedSupplierId={selectedSupplierId}
            onSelectSupplier={setSelectedSupplierId}
            onSearchChange={setSearchText}
          />
        </div>

        {/* Right Pane: Supplier Storefront or Tabs Content */}
        <div className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto custom-scrollbar bg-panel rounded-card p-4 border border-border/50 elevation-raised flex flex-col">
          {selectedSupplierId ? (
            <SupplierStorefront
              supplierId={selectedSupplierId}
              supplier={selectedSupplierObj ? {
                ...selectedSupplierObj,
                id: selectedSupplierObj.businessId,
                name: selectedSupplierObj.name,
                region: selectedSupplierObj.location.region,
                phone: selectedSupplierObj.phones[0],
                email: selectedSupplierObj.email,
                whatsapp: selectedSupplierObj.phones[0],
                business: {
                  name: selectedSupplierObj.name,
                  address: { region: selectedSupplierObj.location.region, district: selectedSupplierObj.location.city, place: selectedSupplierObj.location.label },
                },
              } : undefined}
              onBack={() => setSelectedSupplierId(null)}
            />
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <PurchasesTabs
                activeTab={activeTab}
                onTabChange={(tab: PurchasesTabId) => setActiveTab(tab)}
                counts={counts}
              />

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {activeTab === 'stores' && (
                  <StoresTabContent
                    followedSuppliers={followedSuppliers}
                    onOpenSupplier={handleOpenStore}
                    onUnfollowSupplier={handleUnfollow}
                  />
                )}
                {activeTab === 'recently' && (
                  <OrderList
                    orders={recentlyOrders}
                    suppliers={allSuppliers}
                    onSelectOrder={setSelectedOrderId}
                  />
                )}
                {activeTab === 'pending' && (
                  <OrderList
                    orders={pendingOrders}
                    suppliers={allSuppliers}
                    onSelectOrder={setSelectedOrderId}
                  />
                )}
                {activeTab === 'completed' && (
                  <OrderList
                    orders={completedOrders}
                    suppliers={allSuppliers}
                    onSelectOrder={setSelectedOrderId}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <OrderDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        order={selectedOrder}
        supplier={allSuppliers.find((s) => s.businessId === selectedOrder?.sellerBusinessId) || null}
        onUpdateStatus={updateOrderStatus}
      />
    </TabContainer>
  );
};
