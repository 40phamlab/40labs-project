// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Customer } from './types';
import { fetchCustomersApi } from './api';
import { useConnectionStore } from '../../stores/connection';
import { AddCustomerModal } from './AddCustomerModal';

interface CustomerPickerModalProps {
  visible: boolean;
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

export function CustomerPickerModal({ visible, onSelect, onClose }: CustomerPickerModalProps) {
  const { activeBusinessId } = useConnectionStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const loadCustomers = useCallback(async (query?: string) => {
    if (!activeBusinessId) return;
    setLoading(true);
    try {
      const data = await fetchCustomersApi(activeBusinessId, query);
      setCustomers(data);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    if (visible) {
      loadCustomers(search);
    }
  }, [visible, search, loadCustomers]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Select Customer / Patient</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search by name or phone..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.actionPrimary }]}
              onPress={() => setAddModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.actionPrimary} />
            </View>
          ) : (
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, { borderBottomColor: colors.divider }]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.fullName}</Text>
                  <Text style={[styles.itemPhone, { color: colors.textMuted }]}>{item.phone}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={{ color: colors.textMuted }}>No customers found. Tap + to add patient.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      <AddCustomerModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={(newCust) => {
          onSelect(newCust);
          onClose();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: radius.card,
    borderWidth: 1,
    height: '70%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: radius.card,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    paddingHorizontal: 16,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  itemPhone: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
