// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#settings]
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ScreenHeader, Card } from '../../src/components';
import { useConnectionStore } from '../../src/stores/connection';
import { listServerCredentials, removeServerCredential } from '../../src/lib/secure-store';
import { getDatabase } from '../../src/db/outbox';
import { clearCache } from '../../src/db/cache';
import { flush } from '../../src/lib/outbox-sync';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
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
    <View style={styles.container}>
      <ScreenHeader title={t('nav.settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Server Section */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Server & Connection</Text>
          <Text style={styles.infoText}>Business: {activeServer?.businessName || 'Connected Hub'}</Text>
          <Text style={styles.infoText}>Endpoint: {activeServer?.endpoint || 'N/A'}</Text>
          <Text style={styles.infoText}>Status: <Text style={{ color: status === 'connected' ? colors.success : colors.danger }}>{status}</Text></Text>
          <Text style={styles.infoText}>Permissions: {permissions.join(', ') || 'None'}</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleRemoveServer}>
            <Text style={styles.dangerBtnText}>Remove Server</Text>
          </TouchableOpacity>
        </Card>

        {/* User & Role Section */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>User & Role</Text>
          <Text style={styles.infoText}>User Name: {userInfo?.name || 'Assigned Staff'}</Text>
          <Text style={styles.infoText}>Job Role: {userInfo?.role || 'Staff'}</Text>
        </Card>

        {/* Language Section */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.language')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, language === 'sw-TZ' && styles.activeBtn]}
              onPress={() => setLanguage('sw-TZ')}
            >
              <Text style={[styles.optionText, language === 'sw-TZ' && styles.activeText]}>Swahili (sw-TZ)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, language === 'en' && styles.activeBtn]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.optionText, language === 'en' && styles.activeText]}>English (en)</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Theme Section */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.theme')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, theme === 'dark' && styles.activeBtn]}
              onPress={() => setTheme('dark')}
            >
              <Text style={[styles.optionText, theme === 'dark' && styles.activeText]}>{t('settings.dark')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, theme === 'light' && styles.activeBtn]}
              onPress={() => setTheme('light')}
            >
              <Text style={[styles.optionText, theme === 'light' && styles.activeText]}>{t('settings.light')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Data & Sync Section */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Data & Sync</Text>
          <Text style={styles.infoText}>Unsynced Outbox Items: {unsyncedCount}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={async () => { await flush(); loadUnsyncedCount(); }}>
              <Text style={styles.secondaryBtnText}>Retry Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDiscardUnsynced}>
              <Text style={styles.secondaryBtnText}>Discard Unsynced</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.dangerBtn, { marginTop: 12 }]} onPress={handleClearAllData}>
            <Text style={styles.dangerBtnText}>Clear All Data</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
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
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  activeBtn: {
    backgroundColor: colors.actionPrimary,
    borderColor: colors.borderSelected,
  },
  optionText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  activeText: {
    color: colors.textPrimary,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  dangerBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerBtnText: {
    color: colors.danger,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
