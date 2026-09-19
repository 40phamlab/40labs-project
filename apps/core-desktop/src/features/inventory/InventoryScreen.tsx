// import * as React from 'react';
// import { ChartContainer, Button } from '@40labs/ui-components';
// import { mockMedicines, mockInventoryItems } from '../../lib/mockData';
// import type { Medicine, InventoryItem } from '@40labs/types';
// import { InventoryTable } from './InventoryTable';
// import { InventorySidebar } from './InventorySidebar';
// import { NewStockModal } from './NewStockModal';
//
// /**
//  * MedicineWithInventory
//  * Composition of InventoryItem (batch data) and its corresponding Medicine (metadata).
//  */
// export interface MedicineWithInventory extends InventoryItem {
//   medicine: Medicine;
// }
//
// export const InventoryScreen: React.FC = () => {
//   const [searchTerm, setSearchTerm] = React.useState('');
//   const [filterExpired, setFilterExpired] = React.useState(false);
//   const [isModalOpen, setIsModalOpen] = React.useState(false);
//
//   // Use local state for data so it can be updated via the modal
//   const [data, setData] = React.useState<MedicineWithInventory[]>(() => {
//     return mockInventoryItems.map((item) => {
//       const medicine = mockMedicines.find((m) => m.id === item.medicine_id);
//       if (!medicine) {
//         throw new Error(`Medicine not found for inventory item ${item.id}`);
//       }
//       return { ...item, medicine };
//     });
//   });
//
//   const filteredData = React.useMemo(() => {
//     return data.filter((item) => {
//       const matchesSearch = item.medicine.name.toLowerCase().includes(searchTerm.toLowerCase());
//       const isExpired = new Date(item.expiry_date) < new Date();
//       const matchesExpired = filterExpired ? isExpired : true;
//       return matchesSearch && matchesExpired;
//     });
//   }, [data, searchTerm, filterExpired]);
//
//   const handleAddItem = (newItem: MedicineWithInventory) => {
//     setData((prev) => [newItem, ...prev]);
//   };
//
//   return (
//     <div className="grid grid-cols-[65%_35%] gap-6 p-6 h-full overflow-hidden">
//       {/* Main Column */}
//       <div className="flex flex-col gap-6 overflow-hidden">
//         <div className="flex flex-col gap-2">
//           <h1 className="text-xl font-bold text-text">Inventory Management</h1>
//           <p className="text-xs text-text-muted">Track and manage your stock levels, batches, and expirations.</p>
//         </div>
//
//         <ChartContainer className="h-64 flex-shrink-0 bg-panel-strong/20 border-dashed">
//           <div className="flex flex-col items-center gap-2">
//             <span className="text-sm font-bold uppercase tracking-widest opacity-50">Stock Trends Graph</span>
//             <p className="text-center text-[10px] leading-relaxed opacity-40 max-w-xs">
//               Real-time visualization of stock levels, category distribution,<br />
//               and upcoming expirations will be wired here.
//             </p>
//           </div>
//         </ChartContainer>
//
//         <div className="flex-1 flex flex-col gap-4 overflow-hidden bg-panel/30 rounded-card border border-border/50 p-4 shadow-sm">
//           <div className="flex-1 overflow-auto">
//             <InventoryTable data={filteredData} />
//           </div>
//
//           <div className="flex justify-end pt-2 border-t border-border/30">
//             <Button
//               intent="neutral"
//               className="rounded-full px-8 shadow-surface-pop hover:shadow-none transition-shadow"
//               onClick={() => setIsModalOpen(true)}
//             >
//               Add Stock
//             </Button>
//           </div>
//         </div>
//       </div>
//
//       {/* Sidebar Column */}
//       <div className="overflow-y-auto pr-2 custom-scrollbar">
//         <InventorySidebar
//           searchTerm={searchTerm}
//           onSearchChange={setSearchTerm}
//           filterExpired={filterExpired}
//           onToggleExpired={() => setFilterExpired(!filterExpired)}
//         />
//       </div>
//
//       <NewStockModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onAdd={handleAddItem}
//       />
//     </div>
//   );
// };
//


import * as React from 'react';
import {
  ChartContainer,
  Button,
  IconButton,
} from '@40labs/ui-components';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  mockMedicines,
  mockInventoryItems,
} from '../../lib/mockData';
import type { Medicine, InventoryItem } from '@40labs/types';
import { InventoryTable } from './InventoryTable';
import { InventorySidebar } from './InventorySidebar';
import { NewStockModal } from './NewStockModal';

export interface MedicineWithInventory extends InventoryItem {
  medicine: Medicine;
}

export const InventoryScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterExpired, setFilterExpired] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = React.useState(false);
  const [graphVisible, setGraphVisible] = React.useState(true);

  /**
   * Build the initial inventory data safely.
   *
   * A broken medicine_id should not crash the entire inventory screen.
   */
  const [data, setData] = React.useState<MedicineWithInventory[]>(() => {
    return mockInventoryItems.flatMap((item) => {
      const medicine = mockMedicines.find(
        (m) => m.id === item.medicine_id
      );

      if (!medicine) {
        console.error(
          `[InventoryScreen] Medicine not found for inventory item "${item.id}".`,
          {
            inventoryItemId: item.id,
            medicineId: item.medicine_id,
          }
        );

        return [];
      }

      return [
        {
          ...item,
          medicine,
        },
      ];
    });
  });

  const filteredData = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return data.filter((item) => {
      const medicineName = item.medicine.name.toLowerCase();

      const matchesSearch =
        normalizedSearch === '' ||
        medicineName.includes(normalizedSearch);

      const isExpired = new Date(item.expiry_date) < now;

      const matchesExpired =
        !filterExpired || isExpired;

      return matchesSearch && matchesExpired;
    });
  }, [data, searchTerm, filterExpired]);

  const handleAddItem = React.useCallback(
    (newItem: MedicineWithInventory) => {
      setData((previousData) => [
        newItem,
        ...previousData,
      ]);

      setIsModalOpen(false);
    },
    []
  );

  const handleOpenModal = React.useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleDeleteItem = React.useCallback(
    (id: string) => {
      setData((previousData) =>
        previousData.filter((item) => item.id !== id)
      );
      // Question to Sairiamu: Should stock deletion be PIN-gated?
      // SPEC/inventory.md doesn't explicitly mark it as such yet.
    },
    []
  );

  return (
    <div className="relative flex h-full w-full overflow-y-auto p-6 gap-6 custom-scrollbar">
      {/* Main column */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-6">
        <div className="shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">
              Inventory Management
            </h1>

            <p className="text-xs text-text-muted">
              Track and manage your stock levels, batches, and expirations.
            </p>
          </div>

          {/* Sidebar Toggle Button */}
          <div className="absolute -right-3 top-24 z-20">
            <IconButton
              icon={
                searchPanelOpen ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )
              }
              label={
                searchPanelOpen
                  ? 'Close sidebar'
                  : 'Open sidebar'
              }
              intent="neutral"
              size="sm"
              className="shadow-surface-pop border border-border/50"
              onClick={() =>
                setSearchPanelOpen(!searchPanelOpen)
              }
            />
          </div>
        </div>

        {/* Graph Section */}
        <div
          className={`flex shrink-0 flex-col gap-2 transition-all duration-200 overflow-hidden ${
            graphVisible ? 'h-72' : 'h-10'
          }`}
        >
          <div className="flex items-center gap-2 px-1">
            <IconButton
              icon={
                graphVisible ? (
                  <Eye size={14} />
                ) : (
                  <EyeOff size={14} />
                )
              }
              label={
                graphVisible ? 'Hide graph' : 'Show graph'
              }
              intent="ghost"
              size="sm"
              onClick={() =>
                setGraphVisible(!graphVisible)
              }
            />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
              Stock Trends Graph
            </span>
          </div>

          {graphVisible && (
            <ChartContainer className="flex-1 flex items-center justify-center border-dashed bg-panel-strong/20">
              <div className="flex flex-col items-center gap-2">
                <p className="max-w-xs text-center text-[10px] leading-relaxed opacity-40">
                  Real-time visualization of stock levels,
                  category distribution, and upcoming
                  expirations will be wired here.
                </p>
              </div>
            </ChartContainer>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-card border border-border/50 bg-panel/30 p-4 shadow-sm">
          <div className="w-full">
            <InventoryTable
              data={filteredData}
              onDelete={handleDeleteItem}
            />
          </div>

          <div className="flex shrink-0 justify-end border-t border-border/30 pt-2">
            <Button
              type="button"
              intent="neutral"
              className="rounded-full px-8 shadow-surface-pop transition-shadow hover:shadow-none"
              onClick={handleOpenModal}
            >
              Add Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`transition-all duration-200 overflow-hidden ${
          searchPanelOpen
            ? 'w-[300px] opacity-100'
            : 'w-0 opacity-0 -ml-6'
        }`}
      >
        <div className="w-[300px] min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          <InventorySidebar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterExpired={filterExpired}
            onToggleExpired={() =>
              setFilterExpired((previous) => !previous)
            }
          />
        </div>
      </div>

      {/* New stock modal */}
      <NewStockModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddItem}
      />
    </div>
  );
};

