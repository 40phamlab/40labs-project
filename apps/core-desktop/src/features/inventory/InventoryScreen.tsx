import * as React from 'react';
import {
  PageViewport,
  PageToolbar,
  PageContent,
  Panel,
  Button,
  IconButton,
} from '@40labs/ui-components';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, TrendingUp, RefreshCw } from 'lucide-react';
import { InventoryTable } from './components/InventoryTable';
import { InventorySidebar } from './components/InventorySidebar';
import { NewStockModal } from './components/NewStockModal';
import { StockActionModal } from './components/StockActionModal';
import { useInventory } from '../../hooks/useInventory';

export const InventoryScreen: React.FC = () => {
  const {
    medicines,
    filteredData,
    isLoading,
    isError,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    filterExpired,
    setFilterExpired,
    filterLowStock,
    setFilterLowStock,
    filterOutOfStock,
    setFilterOutOfStock,
    selectedCategory,
    setSelectedCategory,
    isModalOpen,
    setModalOpen,
    graphVisible,
    setGraphVisible,
    searchPanelOpen,
    setSearchPanelOpen,
    selectedActionItem,
    actionModalType,
    openActionModal,
    closeActionModal,
    addItem,
    recordStockAction,
    isAdding,
    isRecordingAction,
  } = useInventory();

  const categories = React.useMemo(() => {
    return Array.from(new Set(medicines.map((m) => m.category))).filter(Boolean);
  }, [medicines]);

  const resetAllFilters = React.useCallback(() => {
    setSearchTerm('');
    setFilterExpired(false);
    setFilterLowStock(false);
    setFilterOutOfStock(false);
    setSelectedCategory(null);
  }, [setSearchTerm, setFilterExpired, setFilterLowStock, setFilterOutOfStock, setSelectedCategory]);

  return (
    <PageViewport>
      {/* Toolbar */}
      <PageToolbar
        left={
          <div className="flex items-center gap-3">
            <IconButton
              icon={graphVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              label={graphVisible ? 'Hide graph' : 'Show graph'}
              intent="ghost"
              size="sm"
              onClick={() => setGraphVisible(!graphVisible)}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <TrendingUp size={12} /> Stock Trends Visualization
            </span>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setModalOpen(true)}
            >
              Add Stock
            </Button>
            <IconButton
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              label="Refresh data"
              intent="ghost"
              size="sm"
              onClick={() => refetch()}
            />
            <IconButton
              icon={searchPanelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              label={searchPanelOpen ? 'Close sidebar' : 'Open sidebar'}
              intent="neutral"
              size="sm"
              onClick={() => setSearchPanelOpen(!searchPanelOpen)}
            />
          </div>
        }
      />

      {/* Content */}
      <PageContent scrollable={false} padding="normal">
        <div className="flex gap-6 h-full w-full overflow-hidden">
          {/* Main Column */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 h-full overflow-hidden">
            {/* Graph / Stats Section */}
            {graphVisible && (
              <Panel variant="inset" className="shrink-0 h-40 p-4 flex items-center justify-center border border-dashed border-border/40">
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold text-text">
                    Stock Trends & Category Analytics
                  </p>
                  <p className="max-w-md text-center text-xs leading-relaxed text-text-muted">
                    Real-time visualization of inventory turnover, category distribution, and stock re-order notifications.
                  </p>
                </div>
              </Panel>
            )}

            {/* Table Region - ONE controlled scroll region */}
            <div className="flex-1 min-h-0 bg-panel rounded-card border border-border/50 p-4 elevation-inset overflow-y-auto custom-scrollbar">
              <InventoryTable
                data={filteredData}
                onAction={openActionModal}
                loading={isLoading}
                error={isError ? (error as Error) : null}
                onRetry={() => refetch()}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div
            className={`transition-all duration-200 overflow-hidden shrink-0 h-full ${
              searchPanelOpen ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -ml-6'
            }`}
          >
            <div className="w-[300px] h-full overflow-y-auto pr-1 custom-scrollbar">
              <InventorySidebar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterExpired={filterExpired}
                onToggleExpired={() => setFilterExpired(!filterExpired)}
                filterLowStock={filterLowStock}
                onToggleLowStock={() => setFilterLowStock(!filterLowStock)}
                filterOutOfStock={filterOutOfStock}
                onToggleOutOfStock={() => setFilterOutOfStock(!filterOutOfStock)}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onResetFilters={resetAllFilters}
                onSync={() => refetch()}
                isSyncing={isLoading}
              />
            </div>
          </div>
        </div>
      </PageContent>

      {/* New Stock Modal */}
      <NewStockModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={async (payload) => {
          await addItem(payload);
        }}
        isLoading={isAdding}
      />

      {/* Semantic Stock Action Modal */}
      <StockActionModal
        item={selectedActionItem}
        actionType={actionModalType}
        isOpen={Boolean(selectedActionItem && actionModalType)}
        onClose={closeActionModal}
        onConfirm={async (payload) => {
          await recordStockAction(payload);
        }}
        isLoading={isRecordingAction}
      />
    </PageViewport>
  );
};
