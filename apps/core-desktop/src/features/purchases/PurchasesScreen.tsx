// [PHASE: marketplace-preview — Purchases shell & collapsible search panel]
import * as React from 'react';
import { TabContainer } from '../../components/TabContainer';
import { SupplierLeftPanel } from './components/SupplierLeftPanel';
import { PurchasesTabs } from './components/PurchasesTabs';
import { StoresTabContent } from './components/StoresTabContent';
import { OrderList } from './components/OrderList';
import { OrderDetailDrawer } from './components/OrderDetailDrawer';
import { SupplierStorefront } from './components/SupplierStorefront';
import { SupplierProfilePage } from './components/SupplierProfilePage';
import { usePurchasesUiStore, PurchasesTabId } from './store/purchasesUi.slice';
import {
  useSuppliersQuery,
  useFollowedSuppliersQuery,
  useOrdersQuery,
  useMarketplaceMutations,
  useCatalogQuery,
} from './hooks/usePurchasesMarketplace';

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
    searchPanelOpen,
    toggleSearchPanel,
  } = usePurchasesUiStore();

  const { data: allSuppliers = [] } = useSuppliersQuery(searchText);
  const { data: followedSuppliers = [] } = useFollowedSuppliersQuery();
  const { data: recentlyOrders = [] } = useOrdersQuery('recently');
  const { data: pendingOrders = [] } = useOrdersQuery('pending');
  const { data: completedOrders = [] } = useOrdersQuery('completed');

  const { toggleFollow, updateOrderStatus } = useMarketplaceMutations();

  const selectedOrder = [...recentlyOrders, ...pendingOrders, ...completedOrders].find((o) => o.id === selectedOrderId) || null;

  // Route state parsed from window.location.hash
  const [routeState, setRouteState] = React.useState<{
    mode: 'list' | 'storefront' | 'profile';
    businessId: string | null;
    tab?: string;
  }>({ mode: 'list', businessId: null });

  const parseHash = React.useCallback(() => {
    const hash = window.location.hash || '#purchases';
    if (hash.includes('/profile')) {
      const match = hash.match(/\/supplier\/([^/]+)\/profile/);
      if (match) {
        return { mode: 'profile' as const, businessId: match[1] };
      }
    } else if (hash.includes('/supplier/')) {
      const match = hash.match(/\/supplier\/([^/?]+)/);
      const urlParams = new URLSearchParams(hash.split('?')[1] || '');
      const tab = urlParams.get('tab') || 'products';
      if (match) {
        return { mode: 'storefront' as const, businessId: match[1], tab };
      }
    }
    return { mode: 'list' as const, businessId: null };
  }, []);

  React.useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash();
      setRouteState(parsed);
      if (parsed.businessId) {
        setSelectedSupplierId(parsed.businessId);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [parseHash, setSelectedSupplierId]);

  const handleNavigate = React.useCallback((route: string) => {
    window.location.hash = route;
  }, []);

  const selectedSupplierObj = allSuppliers.find((s) => s.businessId === routeState.businessId || s.businessId === selectedSupplierId) || null;

  const { data: selectedSupplierCatalog = [] } = useCatalogQuery(undefined, selectedSupplierObj?.businessId);

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
    handleNavigate(`#purchases/supplier/${supplierBusinessId}`);
  }, [handleNavigate]);

  const handleToggleFollowSupplier = React.useCallback(async () => {
    if (!selectedSupplierObj) return;
    const isCurrentlyFollowed = followedSuppliers.some((s) => s.businessId === selectedSupplierObj.businessId);
    await toggleFollow(selectedSupplierObj.businessId, !isCurrentlyFollowed);
  }, [selectedSupplierObj, followedSuppliers, toggleFollow]);

  const isSelectedFollowed = selectedSupplierObj ? followedSuppliers.some((s) => s.businessId === selectedSupplierObj.businessId) : false;

  return (
    <TabContainer>
      <div className="flex flex-row gap-3 flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Search & Directory Panel (Collapsible) */}
        <SupplierLeftPanel
          suppliers={allSuppliers}
          followedSuppliers={followedSuppliers}
          selectedSupplierId={routeState.businessId || selectedSupplierId}
          onSelectSupplier={(id) => {
            if (id) handleNavigate(`#purchases/supplier/${id}`);
            else handleNavigate('#purchases');
          }}
          onSearchChange={setSearchText}
          isOpen={searchPanelOpen}
          onToggleOpen={toggleSearchPanel}
        />

        {/* Right Pane */}
        <div className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto custom-scrollbar bg-panel rounded-card border border-border/50 elevation-raised flex flex-col transition-all duration-200 ease-in-out motion-reduce:transition-none">
          {routeState.mode === 'profile' && selectedSupplierObj ? (
            <SupplierProfilePage
              supplier={selectedSupplierObj}
              catalog={selectedSupplierCatalog}
              orders={[...recentlyOrders, ...pendingOrders, ...completedOrders]}
              isFollowed={isSelectedFollowed}
              onToggleFollow={handleToggleFollowSupplier}
              onNavigate={handleNavigate}
            />
          ) : routeState.mode === 'storefront' && selectedSupplierObj ? (
            <SupplierStorefront
              supplier={selectedSupplierObj}
              initialTab={routeState.tab}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="flex flex-col h-full overflow-hidden p-4">
              <PurchasesTabs
                activeTab={activeTab}
                onTabChange={(tab: PurchasesTabId) => setActiveTab(tab)}
                counts={counts}
              />

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-3">
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
