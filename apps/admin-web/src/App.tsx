import * as React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, BarChart3, RefreshCw, Server, UserCog } from 'lucide-react';
import { AppShell, AppSidebarNav, type NavItem, type NavigationState } from '@40labs/ui-components';
import { TitleBar } from './_copied/components/TitleBar';
import { TabContainer } from './_copied/components/TabContainer';
import './App.css';

type ScreenId = 'overview' | 'businesses' | 'analytics' | 'sync' | 'infra' | 'account';

function AdminShellContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarState, setSidebarState] = React.useState<NavigationState>('open');

  const getActiveScreen = (): ScreenId => {
    const path = location.pathname;
    if (path.startsWith('/businesses')) return 'businesses';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/sync')) return 'sync';
    if (path.startsWith('/infra')) return 'infra';
    if (path.startsWith('/account')) return 'account';
    return 'overview';
  };

  const activeScreen = getActiveScreen();

  const NAV_ITEMS: Array<NavItem<ScreenId>> = [
    { id: 'overview', labelKey: 'Overview', route: '/', icon: <Home size={18} /> },
    { id: 'businesses', labelKey: 'Businesses', route: '/businesses', icon: <Building2 size={18} /> },
    { id: 'analytics', labelKey: 'Analytics', route: '/analytics', icon: <BarChart3 size={18} /> },
    { id: 'sync', labelKey: 'Sync', route: '/sync', icon: <RefreshCw size={18} /> },
    { id: 'infra', labelKey: 'Infra', route: '/infra', icon: <Server size={18} /> },
  ];

  const PINNED_BOTTOM_ITEMS: Array<NavItem<ScreenId>> = [
    { id: 'account', labelKey: 'Account', route: '/account', icon: <UserCog size={18} /> },
  ];

  const topBarElement = (
    <TitleBar
      brandName="40Labs Admin"
      onHelpClick={() => console.log('Help')}
      onUpdateClick={() => console.log('Update')}
      onSettingsClick={() => navigate('/account')}
      onExplorerClick={() => {}}
    />
  );

  const sidebarElement = (
    <AppSidebarNav<ScreenId>
      variant="floating"
      activeRoute={activeScreen}
      navState={sidebarState}
      onNavStateChange={setSidebarState}
      onNavigate={(id) => {
        if (id === 'overview') navigate('/');
        else navigate(`/${id}`);
      }}
      items={NAV_ITEMS}
      pinnedBottomItems={PINNED_BOTTOM_ITEMS}
    />
  );

  return (
    <AppShell
      variant="floating"
      topBar={topBarElement}
      sidebar={sidebarElement}
      navState={sidebarState}
      lastNonClosedState="open"
      onNavStateChange={setSidebarState}
    >
      <div className="h-full w-full animate-screen-enter">
        <Routes>
          <Route path="/" element={<TabContainer isEmpty emptyTitle="Overview" />} />
          <Route path="/businesses" element={<TabContainer isEmpty emptyTitle="Businesses" />} />
          <Route path="/businesses/:id" element={<TabContainer isEmpty emptyTitle="Business Detail" />} />
          <Route path="/analytics" element={<TabContainer isEmpty emptyTitle="Analytics" />} />
          <Route path="/sync" element={<TabContainer isEmpty emptyTitle="Sync Management" />} />
          <Route path="/infra" element={<TabContainer isEmpty emptyTitle="Infrastructure & Health" />} />
          <Route path="/account" element={<TabContainer isEmpty emptyTitle="Admin Account & TOTP" />} />
        </Routes>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminShellContent />
    </BrowserRouter>
  );
}
