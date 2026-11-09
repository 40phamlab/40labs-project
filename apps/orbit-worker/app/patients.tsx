// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, RefreshControl } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { EmptyState, Fab } from '../src/components';
import { useConnectionStore } from '../src/stores/connection';
import { Customer } from '../src/features/customers/types';
import { fetchCustomerListApi } from '../src/features/customers/api';
import { getCache, putCache } from '../src/db/cache';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function PatientsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { status, activeBusinessId } = useConnectionStore();

  const [patients, setPatients] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = useCallback(async (isRefresh = false) => {
    if (!activeBusinessId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchCustomerListApi(activeBusinessId, searchQuery || undefined);
      setPatients(data);
      putCache(`patients_list_${searchQuery}`, data);
    } catch {
      const cached = getCache<Customer[]>(`patients_list_${searchQuery}`);
      if (cached) {
        setPatients(cached.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusinessId, searchQuery]);

  useEffect(() => {
    loadPatients();
  }, [status, activeBusinessId, searchQuery, loadPatients]);

  return (
    <Screen scrollable={false}>
      <AppHeader title={t('customers.patientsListTitle')} onBack={() => router.back()} />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('customers.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.patientCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
            <Text style={[styles.patientName, { color: colors.textPrimary }]}>{item.fullName}</Text>
            <Text variant="mono" style={{ fontSize: 12, color: colors.textSecondary }}>
              {item.phone} · {item.gender || 'N/A'} · {item.bloodGroup ? `Blood: ${item.bloodGroup}` : ''}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPatients(true)} tintColor={colors.actionPrimary} />}
        ListEmptyComponent={!loading ? <EmptyState title={t('customers.noPatientsFound')} icon="people-outline" /> : null}
      />

      <View style={styles.fabContainer}>
        <Fab label={t('customers.actions.addPatient')} icon="person-add" onPress={() => router.push('/patient-add')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 16,
  },
  searchBox: {
    height: 44,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 12,
  },
  patientCard: {
    padding: 14,
    borderWidth: 1,
  },
  patientName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
