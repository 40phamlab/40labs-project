// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, AppState, AppStateStatus } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { ScreenHeader, Chip, EmptyState, Fab, InlineError } from '../../src/components';
import { FabMenu, FabMenuItem } from '../../src/components/FabMenu';
import { useConnectionStore } from '../../src/stores/connection';
import { StaffNotificationItem, NotificationAudience } from '../../src/features/notifications/types';
import { fetchNotificationsApi, markNotificationReadApi, sendNotificationApi } from '../../src/features/notifications/api';
import { NotificationCard } from '../../src/features/notifications/NotificationCard';
import { NotificationDetailModal } from '../../src/features/notifications/NotificationDetailModal';
import { NotificationComposeModal } from '../../src/features/notifications/NotificationComposeModal';

export default function NotificationsScreen() {
  const { t } = useI18n();
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
  }, [activeBusinessId, status]);

  // Polling every 10s while foregrounded + connected, and once on resume
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
    } catch (err: any) {
      // Handle error silently or log
    }
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
    <View style={styles.container}>
      <ScreenHeader title={t('nav.notifications')} />
      <View style={styles.filterRow}>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Role" selected={filter === 'role'} onPress={() => setFilter('role')} />
        <Chip label="Direct" selected={filter === 'direct'} onPress={() => setFilter('direct')} />
        <Chip label="Alert" selected={filter === 'alert'} onPress={() => setFilter('alert')} />
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <InlineError message={errorMessage} onRetry={() => loadNotifications(true)} />
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
        contentContainerStyle={styles.listContent}
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

      <View style={styles.fabContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
