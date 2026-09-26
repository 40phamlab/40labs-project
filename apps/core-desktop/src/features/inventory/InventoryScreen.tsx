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
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => setModalOpen(true)}
          >
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
              variant="ghost"
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
            icon={searchPanelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            label={searchPanelOpen ? 'Close sidebar' : 'Open sidebar'}
            variant="neutral"
            size="sm"
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
                <ChartContainer className="h-full w-full flex items-center justify-center border-dashed bg-surface-secondary/60 rounded-card p-4">
                  <p className="max-w-md text-center text-xs leading-relaxed text-text-muted">
                    Real-time visualization of stock levels, category distribution, and upcoming expirations.
                  </p>
                </ChartContainer>
              </div>
            )}

            {/* Table Region - ONE controlled scroll region */}
            <div className="flex-1 min-h-0 rounded-card border border-border-default bg-surface-secondary/40 p-4 shadow-sm overflow-y-auto custom-scrollbar">
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
