import * as React from 'react';
import { ShoppingCart, UserPlus, PackagePlus, BarChart3 } from 'lucide-react';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import { useCustomersStore } from '../../../stores/useCustomersStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';

export const QuickActionsPanel: React.FC = () => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const setAddPatientModalOpen = useCustomersStore((s) => s.setAddModalOpen);
  const setInventoryModalOpen = useInventoryStore((s) => s.setModalOpen);

  const handleNewSale = () => {
    setActiveScreen('sales');
  };

  const handleAddPatient = () => {
    setAddPatientModalOpen(true);
    setActiveScreen('customers');
  };

  const handleAddStock = () => {
    setInventoryModalOpen(true);
    setActiveScreen('inventory');
  };

  const handleViewReports = () => {
    setActiveScreen('reports');
  };

  const actions = [
    {
      label: t('dashboard.newSale'),
      icon: <ShoppingCart size={16} />,
      onClick: handleNewSale,
      colorClass: 'bg-primary/10 text-primary',
    },
    {
      label: t('dashboard.addPatient'),
      icon: <UserPlus size={16} />,
      onClick: handleAddPatient,
      colorClass: 'bg-accent/10 text-accent',
    },
    {
      label: t('dashboard.addStock'),
      icon: <PackagePlus size={16} />,
      onClick: handleAddStock,
      colorClass: 'bg-info/10 text-info',
    },
    {
      label: t('dashboard.viewReports'),
      icon: <BarChart3 size={16} />,
      onClick: handleViewReports,
      colorClass: 'bg-panel-strong text-text-muted',
    },
  ];

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3">
      <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text border-b border-border/30 pb-2">
        {t('dashboard.quickActions')}
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={action.onClick}
            className="flex flex-col items-start p-3 rounded-card bg-surface-secondary hover:bg-surface-hover border border-border/30 transition-colors group cursor-pointer text-left"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-2 ${action.colorClass}`}>
              {action.icon}
            </div>
            <span className="text-xs font-bold text-text group-hover:text-primary transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
