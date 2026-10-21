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
  Settings,
  ShieldCheck
} from 'lucide-react';
import { AppShell, AppSidebarNav, type NavItem, FilePreview } from '@40labs/ui-components';
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
import { ExplorerScreen } from './features/explorer/ExplorerScreen';
import { AuthDevScreen } from './features/auth/shell/AuthDevScreen';
import { ToastProvider } from './hooks/useToast';
import { useNotifications } from './hooks/useNotifications';
import { useNotificationSound } from './hooks/useNotificationSound';
import { useAlertToasts } from './features/alerts/useAlertToasts';
import { useAlertSound } from './features/alerts/useAlertSound';
import { AuthGate } from './features/auth/AuthGate';
import { FilePreviewProvider, useFilePreviewContext } from './providers/FilePreviewProvider';
import './App.css';

function MainWorkspaceContent() {
  const activeScreen = useNavStore((s) => s.activeScreen);
  const { previewState, selectFileTab, closeFileTab } = useFilePreviewContext();
  const hasOpenFiles = previewState.isOpen && previewState.files.length > 0;

  const renderContent = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'explorer':
        return <ExplorerScreen />;
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
      case 'auth-dev':
        return <AuthDevScreen />;
      default: {
        const label = activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1);
        return (
          <TabContainer
            isEmpty
            emptyTitle={`${label.replace('-', ' ')} Module`}
          />
        );
      }
    }
  };

  return (
    <div key={hasOpenFiles ? 'workspace-file' : activeScreen} className="h-full w-full animate-screen-enter motion-reduce:transition-none">
      {hasOpenFiles ? (
        <FilePreview
          file={previewState.file}
          files={previewState.files}
          index={previewState.currentIndex}
          onIndexChange={selectFileTab}
          onClose={(e) => closeFileTab(previewState.currentIndex, e)}
          onDownload={previewState.onDownload}
          onSaveAs={previewState.onSaveAs}
          onOpenExternal={previewState.onOpenExternal}
          variant="inline"
          className="h-full w-full border-0 rounded-none shadow-none bg-surface-elevated"
        />
      ) : (
        renderContent()
      )}
    </div>
  );
}

export default function App() {
  useAlertToasts();
  useAlertSound();

  const activeScreen = useNavStore((s) => s.activeScreen);
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const sidebarState = useNavStore((s) => s.sidebarState);
  const setSidebarState = useNavStore((s) => s.setSidebarState);
  const lastNonClosedState = useNavStore((s) => s.lastNonClosedState);

  const { notifications } = useNotifications();
  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => n.status === 'unread').length;
  }, [notifications]);

  const { play: playNotificationSound } = useNotificationSound();

  const prevUnreadRef = React.useRef(unreadCount);
  React.useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      playNotificationSound();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, playNotificationSound]);

  // Global keyboard shortcuts (Ctrl+N for sales, Ctrl+E for file explorer, Ctrl+, for settings, Ctrl+K for search)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveScreen('sales');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveScreen('explorer');
      } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setActiveScreen('settings');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveScreen('dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveScreen]);

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
    { id: 'auth-dev', labelKey: 'nav.home', route: 'auth-dev', icon: <ShieldCheck size={18} /> },
    { id: 'settings', labelKey: 'nav.settings', route: 'settings', icon: <Settings size={18} /> },
  ];

  const topBarElement = (
    <TitleBar
      brandName="40Labs"
      onHelpClick={() => console.log('Help clicked')}
      onUpdateClick={() => console.log('Update clicked')}
      onSettingsClick={() => setActiveScreen('settings')}
      onExplorerClick={() => setActiveScreen('explorer')}
    />
  );

  const sidebarElement = (
    <AppSidebarNav<ScreenId>
      variant="floating"
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
      <FilePreviewProvider>
        <AuthGate>
          <AppShell
            variant="floating"
            topBar={topBarElement}
            sidebar={sidebarElement}
            navState={sidebarState}
            lastNonClosedState={lastNonClosedState}
            onNavStateChange={setSidebarState}
          >
            <MainWorkspaceContent />
          </AppShell>
        </AuthGate>
      </FilePreviewProvider>
    </ToastProvider>
  );
}
