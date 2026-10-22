// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { PurchasesTabId } from '../store/purchasesUi.slice';

export interface PurchasesTabsProps {
  activeTab: PurchasesTabId;
  onTabChange: (tab: PurchasesTabId) => void;
  counts: {
    stores: number;
    recently: number;
    pending: number;
    completed: number;
  };
}

export const PurchasesTabs: React.FC<PurchasesTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabs: { id: PurchasesTabId; label: string; count: number }[] = [
    { id: 'stores', label: 'Stores', count: counts.stores },
    { id: 'recently', label: 'Recently', count: counts.recently },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-border/30 pb-3 mb-4 shrink-0 overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-input text-xs font-bold transition-all
              ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-panel-strong text-text-muted hover:text-text hover:bg-panel-strong/80'
              }
            `}
          >
            <span>{tab.label}</span>
            <span
              className={`
                px-1.5 py-0.5 rounded-full text-[10px] font-mono
                ${isActive ? 'bg-white/20 text-white' : 'bg-border/40 text-text-muted'}
              `}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
