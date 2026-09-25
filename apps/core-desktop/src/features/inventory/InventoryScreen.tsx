import * as React from 'react';
import { ChartContainer, Button, IconButton, Card } from '@40labs/ui-components';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
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
    <div className="p-6 h-full w-full overflow-hidden">
      <Card className="elevation-raised rounded-card h-full w-full p-6 flex gap-6 overflow-hidden bg-panel">
        {/* Main column */}
        <div className="relative flex min-w-0 flex-1 flex-col gap-6 h-full overflow-hidden">
          <div className="shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text font-heading">
                Inventory Management
              </h1>
              <p className="text-xs text-text-muted">
                Track and manage your stock levels, batches, and expirations.
              </p>
            </div>

            {/* Sidebar Toggle Button */}
            <div className="absolute -right-3 top-24 z-20">
              <IconButton
                icon={searchPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                label={searchPanelOpen ? 'Close sidebar' : 'Open sidebar'}
                intent="neutral"
                size="sm"
                className="shadow-surface-pop border border-border/50"
                onClick={() => setSearchPanelOpen(!searchPanelOpen)}
              />
            </div>
          </div>

          {/* Graph Section */}
          <div
            className={`flex shrink-0 flex-col gap-2 transition-all duration-200 overflow-hidden ${
              graphVisible ? 'h-64' : 'h-10'
            }`}
          >
            <div className="flex items-center gap-2 px-1">
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

            {graphVisible && (
              <ChartContainer className="flex-1 flex items-center justify-center border-dashed bg-panel-strong/60 rounded-card">
                <div className="flex flex-col items-center gap-2">
                  <p className="max-w-xs text-center text-[10px] leading-relaxed text-text-muted opacity-80">
                    Real-time visualization of stock levels, category distribution, and upcoming expirations.
                  </p>
                </div>
              </ChartContainer>
            )}
          </div>

          {/* Table region */}
          <div className="flex-1 min-h-0 flex flex-col gap-4 rounded-card border border-border/50 bg-panel-strong/60 p-4 shadow-sm overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <InventoryTable data={filteredData} onDelete={deleteItem} />
            </div>
          </div>

          {/* Add Stock */}
          <div className="shrink-0 flex justify-end pt-2 border-t border-border/30">
            <Button
              type="button"
              intent="primary"
              className="rounded-full px-8 shadow-surface-pop transition-shadow hover:shadow-none"
              onClick={() => setModalOpen(true)}
            >
              Add Stock
            </Button>
          </div>
        </div>

        {/* Sidebar */}
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

        {/* New stock modal */}
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
      </Card>
    </div>
  );
};
