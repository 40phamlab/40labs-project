import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNavStore } from './stores/useNavStore';
import { AppSidebar } from './components/AppSidebar';
import SalesScreen from './features/sales/SalesScreen';
import { InventoryList } from './features/inventory/InventoryList';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

/**
 * Main Application Root
 * Handles high-level layout and screen switching based on useNavStore.
 */
export default function App() {
  const activeScreen = useNavStore((state) => state.activeScreen);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen bg-surface font-ui overflow-hidden">
        {/* Navigation Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
          {activeScreen === 'sales' && <SalesScreen />}
          {activeScreen === 'inventory' && <InventoryList />}

          {/* Dashboard and other screens as placeholders */}
          {activeScreen === 'dashboard' && (
            <div className="p-10">
              <h1 className="font-heading text-3xl font-bold text-black/80 mb-2">
                Dashboard
              </h1>
              <p className="text-black/50">
                Welcome to 40Labs Core. Select a module from the sidebar to begin.
              </p>
            </div>
          )}

          {/* Fallback for undeveloped screens */}
          {!['sales', 'inventory', 'dashboard'].includes(activeScreen) && (
            <div className="p-10">
              <h1 className="font-heading text-3xl font-bold text-black/80 mb-2 uppercase">
                {activeScreen}
              </h1>
              <p className="text-black/50 italic">
                This module is currently under development.
              </p>
            </div>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}
