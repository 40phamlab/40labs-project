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
import { AppShell, AppSidebarNav, TopMenuBar, PageViewport, PageContent } from '@40labs/ui-components';
import { TitleBar } from './components/TitleBar';
import { useNavStore, ScreenId } from './stores/useNavStore';
import { InventoryScreen } from './features/inventory/InventoryScreen';
import { SalesScreen } from './features/sales/SalesScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { PurchasesScreen } from './features/purchases/PurchasesScreen';
import { LabScreen } from './features/laboratory/LabScreen';
import { NotificationsScreen } from './features/notifications/NotificationsScreen';
import { ToastProvider } from './hooks/useToast';
import './App.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart size={18} /> },
  { id: 'inventory', label: 'Inventory', icon: <Package size={18} /> },
  { id: 'purchases', label: 'Purchases', icon: <ShoppingBag size={18} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
  { id: 'lab', label: 'Lab', icon: <FlaskConical size={18} /> },
  { id: 'e-pharmacy', label: 'e-pharmacy', icon: <Stethoscope size={18} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { id: 'scheduling', label: 'Scheduling', icon: <Calendar size={18} /> },
  { id: 'education', label: 'Education', icon: <GraduationCap size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
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
          <PageViewport>
            <PageContent
              isEmpty
              emptyTitle={`${label.replace('-', ' ')} Module`}
              emptyMessage="This module is currently under development and will be available soon."
            />
          </PageViewport>
        );
      }
    }
  };

  const topBarElement = (
    <div className="flex items-center justify-between w-full h-10 bg-top-chrome">
      <div className="flex-1 min-w-0">
        <TopMenuBar
          brandName="40Labs"
          onHelpClick={() => console.log('Help clicked')}
          onUpdateClick={() => console.log('Update clicked')}
        />
      </div>
      <TitleBar />
    </div>
  );

  const sidebarElement = (
    <AppSidebarNav
      activeRoute={activeScreen}
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed(!collapsed)}
      onNavigate={(id) => setActiveScreen(id as ScreenId)}
      items={NAV_ITEMS}
      pinnedBottomItems={[
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
      ]}
    />
  );

  return (
    <ToastProvider>
      <AppShell topBar={topBarElement} sidebar={sidebarElement}>
        {renderContent()}
      </AppShell>
    </ToastProvider>
  );
}
