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
import { AppShell, AppSidebarNav, TopMenuBar, type NavItem } from '@40labs/ui-components';
import { TitleBar } from './components/TitleBar';
import { TabContainer } from './components/TabContainer';
import { useNavStore, type ScreenId } from './stores/useNavStore';
import { InventoryScreen } from './features/inventory/InventoryScreen';
import { SalesScreen } from './features/sales/SalesScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { PurchasesScreen } from './features/purchases/PurchasesScreen';
import { LabScreen } from './features/laboratory/LabScreen';
import { NotificationsScreen } from './features/notifications/NotificationsScreen';
import { SchedulingScreen } from './features/scheduling/SchedulingScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ToastProvider } from './hooks/useToast';
import { useNotifications } from './hooks/useNotifications';
import './App.css';

export default function App() {
  const activeScreen = useNavStore((s) => s.activeScreen);
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const sidebarState = useNavStore((s) => s.sidebarState);
  const setSidebarState = useNavStore((s) => s.setSidebarState);
  const toggleSidebar = useNavStore((s) => s.sidebar.toggle);
  const lastNonClosedState = useNavStore((s) => s.lastNonClosedState);

  const { notifications } = useNotifications();
  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => n.status === 'unread').length;
  }, [notifications]);

  const NAV_ITEMS: Array<NavItem<ScreenId>> = [
    { id: 'dashboard', labelKey: 'nav.home', route: 'dashboard', icon: <Home size={18} /> },
    { id: 'sales', labelKey: 'nav.sales', route: 'sales', icon: <ShoppingCart size={18} /> },
    { id: 'inventory', labelKey: 'nav.inventory', route: 'inventory', icon: <Package size={18} /> },
    { id: 'purchases', labelKey: 'nav.purchases', route: 'purchases', icon: <ShoppingBag size={18} /> },
    { id: 'customers', labelKey: 'nav.patients', route: 'customers', icon: <Users size={18} /> },
    { id: 'lab', labelKey: 'nav.lab', route: 'lab', icon: <FlaskConical size={18} /> },
    { id: 'e-pharmacy', labelKey: 'nav.dispensary', route: 'e-pharmacy', icon: <Stethoscope size={18} /> },
    { id: 'reports', labelKey: 'nav.reports', route: 'reports', icon: <BarChart3 size={18} /> },
    { id: 'scheduling', labelKey: 'nav.scheduling', route: 'scheduling', icon: <Calendar size={18} /> },
    { id: 'education', labelKey: 'nav.training', route: 'education', icon: <GraduationCap size={18} /> },
    { id: 'notifications', labelKey: 'nav.notifications', route: 'notifications', icon: <Bell size={18} />, badgeCount: unreadCount > 0 ? unreadCount : undefined },
  ];

  const PINNED_BOTTOM_ITEMS: Array<NavItem<ScreenId>> = [
    { id: 'settings', labelKey: 'nav.settings', route: 'settings', icon: <Settings size={18} /> },
  ];

  const renderContent = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
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
      case 'scheduling':
        return <SchedulingScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default: {
        const label = activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1);
        return (
          <TabContainer
            isEmpty
            emptyTitle={`${label.replace('-', ' ')} Module`}
            emptyMessage="This module is currently under development and will be available soon."
          />
        );
      }
    }
  };

  const topBarElement = (
    <div className="flex items-center justify-between w-full h-10 bg-top-chrome border-b border-border select-none drag-region" data-tauri-drag-region>
      <div className="flex-1 min-w-0 h-full">
        <TopMenuBar
          brandName="40Labs"
          onHelpClick={() => console.log('Help clicked')}
          onUpdateClick={() => console.log('Update clicked')}
          onSettingsClick={() => setActiveScreen('settings')}
          onToggleSidebar={toggleSidebar}
        />
      </div>
      <div className="no-drag shrink-0 h-full" data-tauri-drag-region="false">
        <TitleBar />
      </div>
    </div>
  );

  const sidebarElement = (
    <AppSidebarNav<ScreenId>
      activeRoute={activeScreen}
      navState={sidebarState}
      onNavStateChange={setSidebarState}
      onNavigate={(id) => {
        setActiveScreen(id);
      }}
      items={NAV_ITEMS}
      pinnedBottomItems={PINNED_BOTTOM_ITEMS}
    />
  );

  return (
    <ToastProvider>
      <AppShell
        topBar={topBarElement}
        sidebar={sidebarElement}
        navState={sidebarState}
        lastNonClosedState={lastNonClosedState}
        onNavStateChange={setSidebarState}
      >
        {renderContent()}
      </AppShell>
    </ToastProvider>
  );
}
