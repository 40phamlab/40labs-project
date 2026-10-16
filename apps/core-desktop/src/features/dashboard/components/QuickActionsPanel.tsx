// [phase: 8D] Quick Actions Compact Panel with PDF Sales Report action
import * as React from 'react';
import { ShoppingCart, UserPlus, PackagePlus, FileText, Share2 } from 'lucide-react';
import { useNavStore } from '../../../stores/useNavStore';

export interface QuickActionsPanelProps {
  onOpenAddCustomer?: () => void;
  onOpenAddStock?: () => void;
  onOpenAddPODraft?: () => void;
  onOpenSalesReport?: () => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onOpenAddCustomer,
  onOpenAddStock,
  onOpenAddPODraft,
  onOpenSalesReport,
}) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

  const actions = [
    {
      label: 'Ongeza Mgonjwa',
      icon: <UserPlus size={14} />,
      onClick: () => onOpenAddCustomer?.(),
      colorClass: 'bg-warning/15 text-warning border border-warning-border/30',
    },
    {
      label: 'Ongeza Bidhaa',
      icon: <PackagePlus size={14} />,
      onClick: () => onOpenAddStock?.(),
      colorClass: 'bg-info/15 text-info border border-info-border/30',
    },
    {
      label: 'Ongeza Agizo',
      icon: <FileText size={14} />,
      onClick: () => onOpenAddPODraft?.(),
      colorClass: 'bg-info/15 text-info border border-info-border/30',
    },
    {
      label: 'Mauzo Mapya',
      icon: <ShoppingCart size={14} />,
      onClick: () => setActiveScreen('sales'),
      colorClass: 'bg-success/15 text-success border border-success-border/30',
    },
  ];

  return (
    <div className="bg-panel rounded-card border border-border/50 p-3 elevation-raised flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
        <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-text">
          Hatua za Haraka
        </h3>
        {onOpenSalesReport && (
          <button
            type="button"
            onClick={onOpenSalesReport}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Share2 size={11} /> Ripoti ya Mauzo PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={action.onClick}
            className="flex items-center gap-2 p-2 rounded-[8px] bg-surface-secondary hover:bg-surface-hover border border-border/30 transition-colors group cursor-pointer text-left"
          >
            <div
              className={`w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 ${action.colorClass}`}
            >
              {action.icon}
            </div>
            <span className="text-[11px] font-bold text-text group-hover:text-primary transition-colors truncate">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
