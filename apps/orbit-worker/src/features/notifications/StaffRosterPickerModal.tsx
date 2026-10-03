// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StaffRosterMember } from './types';
import { fetchStaffRosterApi } from './api';

interface StaffRosterPickerModalProps {
  visible: boolean;
  businessId: string | null;
  onSelect: (member: StaffRosterMember) => void;
  onClose: () => void;
}

export function StaffRosterPickerModal({ visible, businessId, onSelect, onClose }: StaffRosterPickerModalProps) {
  const [roster, setRoster] = useState<StaffRosterMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && businessId) {
      setLoading(true);
      setError(null);
      fetchStaffRosterApi(businessId)
        .then((data) => setRoster(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [visible, businessId]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Select Staff Member</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.actionPrimary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={roster}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, { borderBottomColor: colors.divider }]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.displayName}</Text>
                  <Text style={[styles.itemRole, { color: colors.textMuted }]}>{item.jobRole}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.list}
            />
          )}
        </View>
      </View>
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
    height: '60%',
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    padding: 16,
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
  itemRole: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
  },
});
