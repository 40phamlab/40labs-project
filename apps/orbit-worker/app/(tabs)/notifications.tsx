// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, AppState, AppStateStatus, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, AppHeader, Banner } from '../../src/ui';
import { useI18n } from '../../src/i18n/I18nProvider';
import { Chip, EmptyState, Fab } from '../../src/components';
import { FabMenu, FabMenuItem } from '../../src/components/FabMenu';
import { useConnectionStore } from '../../src/stores/connection';
import { StaffNotificationItem, NotificationAudience } from '../../src/features/notifications/types';
import { fetchNotificationsApi, markNotificationReadApi, sendNotificationApi } from '../../src/features/notifications/api';
import { NotificationCard } from '../../src/features/notifications/NotificationCard';
import { NotificationDetailModal } from '../../src/features/notifications/NotificationDetailModal';
import { NotificationComposeModal } from '../../src/features/notifications/NotificationComposeModal';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { status, activeBusinessId } = useConnectionStore();
  const [filter, setFilter] = useState<'all' | 'role' | 'direct' | 'alert'>('all');
  const [notifications, setNotifications] = useState<StaffNotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<StaffNotificationItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeAudience, setComposeAudience] = useState<NotificationAudience>('broadcast');

  const loadNotifications = useCallback(async (isRefresh = false, cursorParam?: string) => {
    if (!activeBusinessId || status !== 'connected') return;

    if (isRefresh) {
      setRefreshing(true);
    } else if (!cursorParam) {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const res = await fetchNotificationsApi(activeBusinessId, cursorParam);
      if (cursorParam) {
        setNotifications((prev) => [...prev, ...res.items]);
      } else {
        setNotifications(res.items);
      }
      setNextCursor(res.nextCursor);
    } catch (err: any) {
      setErrorMessage(err.message || t('dashboard.errorLoading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusinessId, status, t]);

  useEffect(() => {
    if (status !== 'connected' || !activeBusinessId) return;

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications(true);
    }, 10000);

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        loadNotifications(true);
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [status, activeBusinessId, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    if (!activeBusinessId) return;
    try {
      await markNotificationReadApi(activeBusinessId, id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch (err: any) {}
  };

  const handleSendNotification = async (payload: {
    audience: string;
    targetRole?: string | null;
    targetUserId?: string | null;
    severity?: string;
    subject: string;
    body: string;
  }) => {
    if (!activeBusinessId) return;
    const newItem = await sendNotificationApi(activeBusinessId, payload);
    setNotifications((prev) => [newItem, ...prev]);
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'role') return item.audience === 'role';
    if (filter === 'direct') return item.audience === 'direct';
    if (filter === 'alert') return item.severity === 'alert' || item.audience === 'alert';
    return true;
  });

  const fabMenuItems: FabMenuItem[] = [
    {
      id: 'broadcast',
      label: 'Broadcast',
      icon: 'megaphone-outline',
      onPress: () => {
        setComposeAudience('broadcast');
        setComposeVisible(true);
      },
    },
    {
      id: 'role',
      label: 'Role Based',
      icon: 'people-outline',
      onPress: () => {
        setComposeAudience('role');
        setComposeVisible(true);
      },
    },
    {
      id: 'direct',
      label: 'Direct (Uni)',
      icon: 'person-outline',
      onPress: () => {
        setComposeAudience('direct');
        setComposeVisible(true);
      },
    },
    {
      id: 'alert',
      label: 'Alert',
      icon: 'warning-outline',
      onPress: () => {
        setComposeAudience('alert');
        setComposeVisible(true);
      },
    },
  ];

  return (
    <Screen scrollable={false}>
      <AppHeader title={t('nav.notifications')} />
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} style={styles.chip} />
          <Chip label="Role" selected={filter === 'role'} onPress={() => setFilter('role')} style={styles.chip} />
          <Chip label="Direct" selected={filter === 'direct'} onPress={() => setFilter('direct')} style={styles.chip} />
          <Chip label="Alert" selected={filter === 'alert'} onPress={() => setFilter('alert')} style={styles.chip} />
        </ScrollView>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Banner title={errorMessage} variant="offline" />
        </View>
      )}

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onPress={() => {
              setSelectedItem(item);
              setDetailVisible(true);
              if (!item.isRead) {
                handleMarkRead(item.id);
              }
            }}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            tintColor={colors.actionPrimary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState title={t('dashboard.nothingPending')} icon="notifications-off-outline" />
          ) : null
        }
        onEndReached={() => {
          if (nextCursor && !loading) {
            loadNotifications(false, nextCursor);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom, 16) + 64 }]}>
        <Fab label="New" icon="add" onPress={() => setFabMenuVisible(true)} />
      </View>

      <FabMenu
        visible={fabMenuVisible}
        onClose={() => setFabMenuVisible(false)}
        items={fabMenuItems}
      />

      <NotificationDetailModal
        visible={detailVisible}
        item={selectedItem}
        onClose={() => setDetailVisible(false)}
        onMarkRead={handleMarkRead}
      />

      <NotificationComposeModal
        visible={composeVisible}
        initialAudience={composeAudience}
        businessId={activeBusinessId}
        onClose={() => setComposeVisible(false)}
        onSend={handleSendNotification}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    height: 56,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    height: 40,
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
  },
});
