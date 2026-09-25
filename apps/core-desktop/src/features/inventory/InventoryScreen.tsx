import * as React from 'react';
import {
  PageViewport,
  PageHeader,
  PageToolbar,
  PageContent,
  ChartContainer,
  Button,
  IconButton,
} from '@40labs/ui-components';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus } from 'lucide-react';
import { InventoryTable } from './components/InventoryTable';
import { InventorySidebar } from './components/InventorySidebar';
import { NewStockModal } from './components/NewStockModal';
import { useInventory } from '../../hooks/useInventory';

export const InventoryScreen: React.FC = () => {
  const {
    filteredData,
    searchTerm,
    setSearchTerm,
    filterExpired,
    setFilterExpired,
    isModalOpen,
    setModalOpen,
    graphVisible,
    setGraphVisible,
    searchPanelOpen,
    setSearchPanelOpen,
    addItem,
    deleteItem,
  } = useInventory();

  return (
    <PageViewport>
      {/* Header */}
      <PageHeader
        title="Inventory Management"
        subtitle="Track and manage your stock levels, batches, and expirations."
        actions={
          <Button
            type="button"
            intent="primary"
            className="rounded-full px-6 shadow-surface-pop"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={16} className="mr-1.5" />
            Add Stock
          </Button>
        }
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={graphVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              label={graphVisible ? 'Hide graph' : 'Show graph'}
              intent="ghost"
              size="sm"
              onClick={() => setGraphVisible(!graphVisible)}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Stock Trends Graph
            </span>
          </div>
        }
        right={
          <IconButton
            icon={searchPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            label={searchPanelOpen ? 'Close sidebar' : 'Open sidebar'}
            intent="neutral"
            size="sm"
            className="shadow-surface-pop border border-border/50"
            onClick={() => setSearchPanelOpen(!searchPanelOpen)}
          />
        }
      />

      {/* Content */}
      <PageContent scrollable={false} padding="normal">
        <div className="flex gap-6 h-full w-full overflow-hidden">
          {/* Main Column */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 h-full overflow-hidden">
            {/* Graph Section */}
            {graphVisible && (
              <div className="shrink-0 h-48 transition-all duration-200 overflow-hidden">
                <ChartContainer className="h-full w-full flex items-center justify-center border-dashed bg-panel-strong/60 rounded-card p-4">
                  <p className="max-w-md text-center text-xs leading-relaxed text-text-muted">
                    Real-time visualization of stock levels, category distribution, and upcoming expirations.
                  </p>
                </ChartContainer>
              </div>
            )}

            {/* Table Region - ONE controlled scroll region */}
            <div className="flex-1 min-h-0 rounded-card border border-border/50 bg-panel-strong/40 p-4 shadow-sm overflow-y-auto custom-scrollbar">
              <InventoryTable data={filteredData} onDelete={deleteItem} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div
            className={`transition-all duration-200 overflow-hidden shrink-0 h-full ${
              searchPanelOpen ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -ml-6'
            }`}
          >
            <div className="w-[300px] h-full overflow-y-auto pr-2 custom-scrollbar">
              <InventorySidebar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterExpired={filterExpired}
                onToggleExpired={() => setFilterExpired(!filterExpired)}
              />
            </div>
          </div>
        </div>
      </PageContent>

      {/* Modal */}
      <NewStockModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(item) =>
          addItem({
            medicineName: item.medicine.name,
            genericName: item.medicine.generic_name || undefined,
            category: item.medicine.category,
            unit: item.medicine.unit,
            batchNumber: item.batch_number,
            expiryDate: item.expiry_date,
            buyPrice: item.buy_price,
            sellPrice: item.sell_price,
            quantity: item.quantity,
            lowStockThreshold: item.low_stock_threshold,
          })
        }
      />
    </PageViewport>
  );
};
