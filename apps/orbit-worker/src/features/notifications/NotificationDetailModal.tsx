// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StaffNotificationItem } from './types';

interface NotificationDetailModalProps {
  visible: boolean;
  item: StaffNotificationItem | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export function NotificationDetailModal({ visible, item, onClose, onMarkRead }: NotificationDetailModalProps) {
  if (!visible || !item) return null;

  const isAlert = item.severity === 'alert' || item.audience === 'alert';

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons
                name={isAlert ? 'warning' : 'notifications'}
                size={20}
                color={isAlert ? colors.danger : colors.actionPrimary}
                style={styles.headerIcon}
              />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {item.audience.toUpperCase()} NOTIFICATION
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.subject, { color: colors.textPrimary }]}>{item.subject}</Text>

            <View style={styles.metadataContainer}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                From: <Text style={{ color: colors.textPrimary }}>{item.senderName}</Text>
              </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Time: <Text style={{ color: colors.textPrimary }}>{new Date(item.createdAt).toLocaleString()}</Text>
              </Text>
              {item.targetRole && (
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  Target Role: <Text style={{ color: colors.textPrimary }}>{item.targetRole}</Text>
                </Text>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <Text style={[styles.body, { color: colors.textSecondary }]}>{item.body}</Text>
          </ScrollView>

          <View style={styles.footer}>
            {!item.isRead && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.actionPrimary }]}
                onPress={() => {
                  onMarkRead(item.id);
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>Mark as Read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.borderSubtle }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '80%',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
  },
  content: {
    padding: 20,
  },
  subject: {
    fontSize: 18,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  metadataContainer: {
    gap: 4,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.card,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
