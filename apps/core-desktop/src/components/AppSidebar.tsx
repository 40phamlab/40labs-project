import React from 'react';
import { useNavStore, ScreenId } from '../stores/useNavStore';

const Icon = ({ children }: { children: React.ReactNode }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
const DashboardIcon = () => <Icon><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;
const SalesIcon = () => <Icon><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L20 8H5"/></Icon>;
const InventoryIcon = () => <Icon><path d="m7.5 4.3 9 5.1"/><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></Icon>;
const CustomersIcon = () => <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></Icon>;
const PurchasesIcon = () => <Icon><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></Icon>;
const LabIcon = () => <Icon><path d="M10 2v7.3M14 9.3V2M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0M5.5 16h13"/></Icon>;
const SettingsIcon = () => <Icon><path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></Icon>;
interface ScreenConfig { id: ScreenId; label: string; Icon: React.FC; }
const SCREENS: ScreenConfig[] = [
 {id:'dashboard',label:'Dashboard',Icon:DashboardIcon},{id:'sales',label:'Sales',Icon:SalesIcon},{id:'inventory',label:'Inventory',Icon:InventoryIcon},{id:'customers',label:'Customers',Icon:CustomersIcon},{id:'purchases',label:'Purchases',Icon:PurchasesIcon},{id:'lab',label:'Lab',Icon:LabIcon},{id:'settings',label:'Settings',Icon:SettingsIcon}
];
export const AppSidebar: React.FC = () => {
 const activeScreen=useNavStore(s=>s.activeScreen); const setActiveScreen=useNavStore(s=>s.setActiveScreen);
 return <aside className="w-[52px] h-full bg-surface border-r border-border/60 flex flex-col items-center py-2 gap-2 shrink-0">
  <div className="w-9 h-9 rounded-full bg-primary text-surface flex items-center justify-center font-heading font-bold text-sm elevation-raised mb-1">40</div>
  <nav className="flex flex-col gap-2 w-full items-center">{SCREENS.map(({id,label,Icon:ItemIcon})=>{const active=activeScreen===id;return <button key={id} onClick={()=>setActiveScreen(id)} title={label} className={`relative w-9 h-9 rounded-input flex items-center justify-center transition-shadow duration-150 ${active?'bg-accent text-surface elevation-raised':'bg-panel text-text-muted hover:elevation-hover'}`}><ItemIcon/>{active&&<span className="absolute -left-2 w-1 h-5 rounded-r-full bg-accent"/>}</button>})}</nav>
  <div className="mt-auto text-[7px] font-mono text-text-muted/40 uppercase tracking-[.2em]" style={{writingMode:'vertical-lr',transform:'rotate(180deg)'}}>40Labs Core</div>
 </aside>;
};
