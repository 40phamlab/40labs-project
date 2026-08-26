import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@40labs/ui-components';
import { InventoryList } from './features/inventory/InventoryList';
import SalesPOS from './features/sales/SalesPOS';
import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * [PHASE: MVP] Main Entry Point.
 * Contains a temporary navigation layer for dev preview.
 * Real routing (react-router) will replace the local state below in a later task.
 */
function App() {
  const [activeView, setActiveView] = useState<'inventory' | 'sales'>('sales');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface flex flex-col">

        {/* TEMPORARY DEV NAV — DO NOT PORT TO PRODUCTION ROUTING */}
        <nav className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 z-50">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">40</div>
            <span className="font-heading font-bold text-sm tracking-tight text-black/80">40Labs / Core</span>
          </div>

          <Button
            intent={activeView === 'inventory' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveView('inventory')}
          >
            Inventory
          </Button>

          <Button
            intent={activeView === 'sales' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveView('sales')}
          >
            Sales / POS
          </Button>

          <div className="ml-auto text-[10px] font-mono text-black/30 uppercase tracking-widest">
            MVP Preview Mode
          </div>
        </nav>

        {/* Feature Render Surface */}
        <main className="flex-1 overflow-hidden">
          {activeView === 'inventory' ? (
            <div className="p-6 h-full">
              <InventoryList />
            </div>
          ) : (
            <SalesPOS />
          )}
        </main>

      </div>
    </QueryClientProvider>
  );
}

export default App;
