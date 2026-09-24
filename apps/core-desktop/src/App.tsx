import * as React from 'react';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  ShoppingBag,
  FlaskConical,
  Stethoscope,
  BarChart3,
  Calendar,
  GraduationCap,
  Bell,
  Settings
} from 'lucide-react';
import { AppSidebarNav, TopMenuBar } from '@40labs/ui-components';
import { TitleBar } from './components/TitleBar';
import { useNavStore, ScreenId } from './stores/useNavStore';
import { InventoryScreen } from './features/inventory/InventoryScreen';
import { SalesScreen } from './features/sales/SalesScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { PurchasesScreen } from './features/purchases/PurchasesScreen';
import { LabScreen } from './features/lab/LabScreen';
import { NotificationsScreen } from './features/notifications/NotificationsScreen';
import './App.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart size={20} /> },
  { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
  { id: 'purchases', label: 'Purchases', icon: <ShoppingBag size={20} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
  { id: 'lab', label: 'Lab', icon: <FlaskConical size={20} /> },
  { id: 'e-pharmacy', label: 'e-pharmacy', icon: <Stethoscope size={20} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  { id: 'scheduling', label: 'Scheduling', icon: <Calendar size={20} /> },
  { id: 'education', label: 'Education', icon: <GraduationCap size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
];

export default function App() {
  const activeScreen = useNavStore((s) => s.activeScreen);
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const [collapsed, setCollapsed] = React.useState(true);

  const renderContent = () => {
    switch (activeScreen) {
      case 'inventory':
        return <InventoryScreen />;
      case 'sales':
        return <SalesScreen />;
      case 'customers':
        return <CustomersScreen />;
      case 'purchases':
        return <PurchasesScreen />;
      case 'lab':
        return <LabScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      default: {
        const label = activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1);
        return (
          <div className="flex items-center justify-center h-full text-text-muted">
            <p className="text-xl font-heading font-medium italic opacity-60">
              {label.replace('-', ' ')} — not built yet
            </p>
          </div>
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-surface text-text font-ui overflow-hidden">
      <div className="flex bg-surface-strong border-b border-border items-center">
        <div className="flex-1">
          <TopMenuBar
            brandName="40Labs"
            onHelpClick={() => console.log('Help clicked')}
            onUpdateClick={() => console.log('Update clicked')}
          />
        </div>
        <TitleBar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AppSidebarNav
          activeRoute={activeScreen}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onNavigate={(id) => setActiveScreen(id as ScreenId)}
          items={NAV_ITEMS}
          pinnedBottomItems={[
            { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
          ]}
        />
        <main className="flex-1 overflow-hidden relative bg-surface">
          <div className="h-full w-full overflow-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
