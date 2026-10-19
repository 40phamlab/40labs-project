import * as React from 'react';
import {
  PageToolbar,
  Button,
  IconButton,
} from '@40labs/ui-components';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, ArrowDownToLine } from 'lucide-react';
import { TabContainer } from '../../components/TabContainer';
import { InventoryTable } from './components/InventoryTable';
import { InventorySidebar } from './components/InventorySidebar';
import { NewStockModal } from './components/NewStockModal';
import { StockActionModal } from './components/StockActionModal';
import { DataImportModal } from '../../components/DataImportModal';
import { StockAnalyticsPanel } from './components/StockAnalyticsPanel';
import { useInventory } from '../../hooks/useInventory';
import { inventoryApi } from '../../api/inventoryApi';

export const InventoryScreen: React.FC = () => {
  const {
    items,
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

  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

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

  const existingStockRecords = React.useMemo(() => {
    return items.map((d) => ({
      name: d.medicine.name,
      batchNumber: d.batch_number,
    }));
  }, [items]);

  const handleExecuteImport = async (rows: Array<Record<string, any>>, duplicateStrategy: 'skip' | 'update' | 'new') => {
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    let rejected = 0;

    for (const row of rows) {
      try {
        const existing = items.find(
          (d) => d.batch_number === row.batchNumber || d.medicine.name.toLowerCase() === row.medicineName.toLowerCase()
        );

        if (existing) {
          if (duplicateStrategy === 'skip') {
            skipped++;
            continue;
          } else if (duplicateStrategy === 'update') {
            await inventoryApi.update(existing.id, {
              batchNumber: row.batchNumber,
              expiryDate: row.expiryDate,
              buyPrice: row.buyPrice,
              sellPrice: row.sellPrice,
              quantity: row.quantity,
              lowStockThreshold: row.lowStockThreshold || 10,
            });
            updated++;
            continue;
          }
        }

        await inventoryApi.create({
          medicineName: row.medicineName,
          genericName: row.genericName || undefined,
          category: row.category,
          unit: row.unit,
          batchNumber: row.batchNumber,
          expiryDate: row.expiryDate,
          buyPrice: row.buyPrice,
          sellPrice: row.sellPrice,
          quantity: row.quantity,
          lowStockThreshold: row.lowStockThreshold || 10,
        });
        imported++;
      } catch {
        rejected++;
      }
    }

    await refetch();
    return { imported, skipped, updated, rejected };
  };

  return (
    <TabContainer
      toolbar={
        <PageToolbar
          left={<div className="font-heading text-xs font-bold uppercase tracking-wider text-text">AKIBA (INVENTORY)</div>}
          right={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                intent="secondary"
                size="sm"
                leftIcon={<ArrowDownToLine size={14} />}
                onClick={() => setIsImportModalOpen(true)}
              >
                Import Stock
              </Button>
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
      }
      overlays={
        <>
          <NewStockModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onAdd={async (payload) => {
              await addItem(payload);
            }}
            isLoading={isAdding}
          />
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
          <DataImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            moduleType="stock"
            existingRecords={existingStockRecords}
            onExecuteImport={handleExecuteImport}
            onImportComplete={() => {
              refetch();
            }}
          />
        </>
      }
    >
      <div className="flex gap-3.5 flex-1 min-h-0 w-full overflow-hidden">
        {/* Main Column */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 h-full overflow-hidden">
          {/* Stock Analytics Panel */}
          <StockAnalyticsPanel
            graphVisible={graphVisible}
            onToggleGraph={() => setGraphVisible(!graphVisible)}
            onSelectCategory={(category) => setSelectedCategory(category)}
            onSelectStatus={(status) => {
              setFilterExpired(status === 'expired');
              setFilterLowStock(status === 'low');
              setFilterOutOfStock(status === 'out');
            }}
            onSelectItemSearch={(itemId) => {
              const found = items.find((i) => i.id === itemId);
              if (found) {
                setSearchTerm(found.batch_number);
              }
            }}
          />

          {/* Table Region - ONE controlled scroll region */}
          <div className="flex-1 min-h-0 bg-panel rounded-card border border-border/50 p-3 elevation-inset overflow-y-auto custom-scrollbar">
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
            searchPanelOpen ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -ml-3.5'
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
    </TabContainer>
  );
};
