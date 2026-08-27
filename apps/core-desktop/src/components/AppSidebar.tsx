import React from 'react';
import { useNavStore, ScreenId } from '../stores/useNavStore';

const DashboardIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const SalesIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>;
const InventoryIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
const CustomersIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const PurchasesIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
const LabIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31" /><path d="M14 9.3V2" /><path d="M8.5 2h7" /><path d="M14 9.3a6.5 6.5 0 1 1-4 0" /><path d="M5.52 16h12.96" /></svg>;
const SettingsIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;

interface ScreenConfig { id: ScreenId; label: string; Icon: React.FC; isLegacy?: boolean; }
const SCREENS: ScreenConfig[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon }, { id: 'sales', label: 'Sales', Icon: SalesIcon, isLegacy: true },
  { id: 'inventory', label: 'Inventory', Icon: InventoryIcon, isLegacy: true }, { id: 'customers', label: 'Customers', Icon: CustomersIcon },
  { id: 'purchases', label: 'Purchases', Icon: PurchasesIcon }, { id: 'lab', label: 'Lab', Icon: LabIcon }, { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export const AppSidebar: React.FC = () => {
  const activeScreen = useNavStore((state) => state.activeScreen);
  const setActiveScreen = useNavStore((state) => state.setActiveScreen);
  return <aside className="w-16 h-full bg-surface-strong border-r border-black/5 flex flex-col items-center py-4 gap-4 z-50 shrink-0">
    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4 shadow-sm">40</div>
    <nav className="flex flex-col gap-3">{SCREENS.map((screen) => { const isActive = activeScreen === screen.id; const { Icon } = screen; return <button key={screen.id} onClick={() => setActiveScreen(screen.id)} className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${isActive ? 'bg-accent text-white shadow-md' : 'bg-black/5 text-black/40 hover:bg-black/10'}`} title={screen.label}><Icon />{screen.isLegacy && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full border border-surface-strong shadow-sm" />}{isActive && <div className="absolute -left-2.5 w-1 h-5 bg-accent rounded-r-full" />}</button>; })}</nav>
    <div className="mt-auto text-[8px] font-mono text-black/20 uppercase tracking-widest py-2" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>40Labs Core</div>
  </aside>;
};
