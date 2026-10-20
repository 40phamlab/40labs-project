// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#settings]
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius } from '../../src/theme/rn-tokens';
import { Screen, AppHeader, Text, FormSection, Button, StatusPill, BottomSheet, Banner } from '../../src/ui';
import { useI18n } from '../../src/i18n/I18nProvider';
import { Chip } from '../../src/components';
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
  const insets = useSafeAreaInsets();
  const { status, permissions, userInfo, activeBusinessId } = useConnectionStore();
  const router = useRouter();

  const [activeServer, setActiveServer] = useState<any>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [removeServerModalVisible, setRemoveServerModalVisible] = useState(false);

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

  const handleRemoveServerConfirm = async () => {
    if (activeServer) {
      await removeServerCredential(activeServer.businessId);
      clearCache();
      router.replace('/pair');
    }
    setRemoveServerModalVisible(false);
  };

  return (
    <Screen scrollable={false}>
      <AppHeader title={t('nav.settings')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}>
        <FormSection title="Server & Connection">
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Business: {activeServer?.businessName || 'Connected Hub'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Endpoint: {activeServer?.endpoint || 'N/A'}</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Status:</Text>
            <StatusPill
              status={status === 'connected' ? 'success' : status === 'revoked' ? 'danger' : 'warning'}
              label={status}
            />
          </View>
          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.danger }]}
            onPress={() => setRemoveServerModalVisible(true)}
          >
            <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Remove Server</Text>
          </TouchableOpacity>
        </FormSection>

        <FormSection title="User & Role">
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>User Name: {userInfo?.name || 'Assigned Staff'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Job Role: {userInfo?.role || 'Staff'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: 8 }]}>Permissions:</Text>
          <View style={styles.chipsRow}>
            {permissions.length > 0 ? (
              permissions.map((p) => (
                <Chip key={p} label={permissionLabels[p] || p} selected={false} onPress={() => {}} />
              ))
            ) : (
              <Text style={[styles.infoText, { color: colors.textMuted }]}>None</Text>
            )}
          </View>
        </FormSection>

        <FormSection title={t('settings.language')}>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.optionBtn,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card },
                language === 'sw-TZ' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected },
              ]}
              onPress={() => setLanguage('sw-TZ')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, language === 'sw-TZ' && { color: colors.textOnDark }]}>
                Swahili (sw-TZ)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionBtn,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card },
                language === 'en' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected },
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, language === 'en' && { color: colors.textOnDark }]}>
                English (en)
              </Text>
            </TouchableOpacity>
          </View>
        </FormSection>

        <FormSection title={t('settings.theme')}>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.optionBtnTheme,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card },
                theme === 'dark' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected },
              ]}
              onPress={() => setTheme('dark')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, theme === 'dark' && { color: colors.textOnDark }]}>
                {t('settings.dark')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionBtnTheme,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card },
                theme === 'light' && { backgroundColor: colors.actionPrimary, borderColor: colors.borderSelected },
              ]}
              onPress={() => setTheme('light')}
            >
              <Text style={[styles.optionText, { color: colors.textSecondary }, theme === 'light' && { color: colors.textOnDark }]}>
                {t('settings.light')}
              </Text>
            </TouchableOpacity>
          </View>
        </FormSection>

        <FormSection title="Device & State">
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Device Label: {userInfo?.deviceLabel || Device.deviceName || 'Orbit Worker Phone'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Revoke State: {status === 'revoked' ? 'Revoked' : 'Active'}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Unsynced Outbox Items: {unsyncedCount}</Text>
          <View style={styles.row}>
            <Button
              title="Retry Sync"
              variant="secondary"
              onPress={async () => {
                await flush();
                loadUnsyncedCount();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </FormSection>
      </ScrollView>

      <BottomSheet
        visible={removeServerModalVisible}
        onClose={() => setRemoveServerModalVisible(false)}
        title="Remove Server Confirmation"
      >
        <Text style={[styles.infoText, { color: colors.textSecondary, marginBottom: 16 }]}>
          Are you sure you want to remove this paired server? You will need to re-pair to reconnect.
        </Text>
        <View style={styles.row}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => setRemoveServerModalVisible(false)}
            style={{ flex: 1 }}
          />
          <Button
            title="Remove"
            variant="danger"
            onPress={handleRemoveServerConfirm}
            style={{ flex: 1 }}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
    height: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBtnTheme: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  dangerBtn: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dangerBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
