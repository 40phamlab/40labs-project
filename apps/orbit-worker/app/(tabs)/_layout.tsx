// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { BottomTabBar, TabItem } from '../../src/components/BottomTabBar';
import { useI18n } from '../../src/i18n/I18nProvider';

export default function TabLayout() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTabId = () => {
    if (pathname.includes('/history')) return 'history';
    if (pathname.includes('/notifications')) return 'notifications';
    if (pathname.includes('/settings')) return 'settings';
    return 'home';
  };

  const tabs: TabItem[] = [
    { id: 'home', label: t('nav.home'), icon: 'home-outline', activeIcon: 'home' },
    { id: 'history', label: t('nav.history'), icon: 'time-outline', activeIcon: 'time' },
    { id: 'notifications', label: t('nav.notifications'), icon: 'notifications-outline', activeIcon: 'notifications' },
    { id: 'settings', label: t('nav.settings'), icon: 'settings-outline', activeIcon: 'settings' },
  ];

  const handleTabPress = (id: string) => {
    switch (id) {
      case 'home':
        router.replace('/(tabs)');
        break;
      case 'history':
        router.replace('/(tabs)/history');
        break;
      case 'notifications':
        router.replace('/(tabs)/notifications');
        break;
      case 'settings':
        router.replace('/(tabs)/settings');
        break;
    }
  };

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => (
        <BottomTabBar
          tabs={tabs}
          activeTabId={getActiveTabId()}
          onTabPress={handleTabPress}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
