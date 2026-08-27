import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNavStore } from './stores/useNavStore';
import { AppSidebar } from './components/AppSidebar';
import SalesScreen from './features/sales/SalesScreen';
import { InventoryList } from './features/inventory/InventoryList';
import './App.css';
const queryClient = new QueryClient();
export default function App() {
 const activeScreen=useNavStore(s=>s.activeScreen);
 return <QueryClientProvider client={queryClient}><div className="flex h-screen w-screen bg-surface text-text font-ui overflow-hidden"><AppSidebar/><main className="flex-1 relative overflow-hidden">{activeScreen==='sales'&&<SalesScreen/>}{activeScreen==='inventory'&&<InventoryList/>}{!['sales','inventory'].includes(activeScreen)&&<div className="h-full bg-surface flex items-center justify-center"><div className="w-[82%] h-[78%] rounded-card bg-panel elevation-raised flex items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-surface font-heading font-bold">40</div><h1 className="font-heading text-2xl font-bold text-text">{activeScreen[0].toUpperCase()+activeScreen.slice(1)}</h1><p className="mt-2 text-sm text-text-muted">Module workspace</p></div></div></div>}</main></div></QueryClientProvider>;
}
