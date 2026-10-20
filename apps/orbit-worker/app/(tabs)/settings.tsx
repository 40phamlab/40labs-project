// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#settings]
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius } from '../../src/theme/rn-tokens';
import { Screen, AppHeader } from '../../src/ui';
import { useI18n } from '../../src/i18n/I18nProvider';
import { Card, Chip } from '../../src/components';
import { useConnectionStore } from '../../src/stores/connection';
import { listServerCredentials, removeServerCredential } from '../../src/lib/secure-store';
import { getDatabase } from '../../src/db/outbox';
import { clearCache } from '../../src/db/cache';
import { flush } from '../../src/lib/outbox-sync';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';

const permissionLabels: Record<string, string> = {
  can_update_stock: 'Update Stock',
  can_view_stock: 'View Stock',
  can_manage_customers: 'Manage Customers',
  can_create_sale: 'Create Sales',
  can_add_lab_sample: 'Add Lab Sample',
  can_record_lab_result: 'Record Lab Result',
  can_send_notifications: 'Send Notifications',
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const { status, permissions, userInfo, activeBusinessId } = useConnectionStore();
  const router = useRouter();

  const [activeServer, setActiveServer] = useState<any>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  const loadServerData = async () => {
    const servers = await listServerCredentials();
    if (servers.length > 0) {
      setActiveServer(servers[0]);
    }
  };

  const loadUnsyncedCount = () => {
    try {
      const db = getDatabase();
      const row = db.getFirstSync(`SELECT COUNT(*) as count FROM outbox WHERE status = 'pending';`);
      setUnsyncedCount(row?.count || 0);
    } catch {
      setUnsyncedCount(0);
    }
  };

  useEffect(() => {
    loadServerData();
    loadUnsyncedCount();
  }, [activeBusinessId]);

  const handleRemoveServer = () => {
    Alert.alert(
      'Remove Server',
      'Are you sure you want to remove this paired server?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (activeServer) {
              await removeServerCredential(activeServer.businessId);
              clearCache();
              router.replace('/pair');
            }
          },
        },
      ]
    );
  };

  const handleDiscardUnsynced = () => {
    Alert.alert(
      'Discard Unsynced',
      'Are you sure you want to discard all pending outbox items? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync(`DELETE FROM outbox WHERE status = 'pending';`);
              loadUnsyncedCount();
            } catch {}
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all server credentials, local read cache, and unsynced outbox data. You will need to re-pair the device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              clearCache();
              const db = getDatabase();
              db.runSync(`DELETE FROM outbox;`);
              const servers = await listServerCredentials();
              for (const s of servers) {
                await removeServerCredential(s.businessId);
              }
              router.replace('/pair');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear local data.');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen scrollable={false}>
      <AppHeader title={t('nav.settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Server & Connection</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Business: {activeServer?.businessName || 'Connected Hub'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Endpoint: {activeServer?.endpoint || userInfo?.deviceLabel ? activeServer?.endpoint : 'N/A'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Device Label: {userInfo?.deviceLabel || Device.deviceName || 'Orbit Worker Phone'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Status: <Text style={{ color: status === 'connected' ? colors.success : colors.danger }}>{status}</Text></Text>
          <Text style={[styles.infoText, { color: colors.textSecondary, marginBottom: 8 }]}>Permissions:</Text>
          <View style={styles.chipsRow}>
            {permissions.length > 0 ? (
              permissions.map((p) => (
                <Chip key={p} label={permissionLabels[p] || p} selected={false} onPress={() => {}} />
              ))
            ) : (
              <Text style={[styles.infoText, { color: colors.textMuted }]}>None</Text>
            )}
          </View>
          <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.danger, marginTop: 12 }]} onPress={handleRemoveServer}>
            <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Remove Server</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>User & Role</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>User Name: {userInfo?.name || 'Assigned Staff'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Job Role: {userInfo?.role || 'Staff'}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('settings.language')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }, language === 'sw-TZ' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected }]}
              onPress={() => setLanguage('sw-TZ')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, language === 'sw-TZ' && { color: colors.textPrimary }]}>Swahili (sw-TZ)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }, language === 'en' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected }]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, language === 'en' && { color: colors.textPrimary }]}>English (en)</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('settings.theme')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }, theme === 'dark' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected }]}
              onPress={() => setTheme('dark')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, theme === 'dark' && { color: colors.textPrimary }]}>{t('settings.dark')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }, theme === 'light' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected }]}
              onPress={() => setTheme('light')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, theme === 'light' && { color: colors.textPrimary }]}>{t('settings.light')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Data & Sync</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Unsynced Outbox Items: {unsyncedCount}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]} onPress={async () => { await flush(); loadUnsyncedCount(); }}>
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Retry Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]} onPress={handleDiscardUnsynced}>
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Discard Unsynced</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.danger, marginTop: 12 }]} onPress={handleClearAllData}>
            <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Clear All Data</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  dangerBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
