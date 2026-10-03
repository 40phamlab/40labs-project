// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StaffNotificationItem } from './types';

interface NotificationCardProps {
  item: StaffNotificationItem;
  onPress: () => void;
}

export function NotificationCard({ item, onPress }: NotificationCardProps) {
  const isAlert = item.severity === 'alert' || item.audience === 'alert';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: isAlert ? colors.danger : colors.borderSubtle,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.subject}
    >
      <View style={styles.headerRow}>
        <View style={styles.senderContainer}>
          <Ionicons
            name={isAlert ? 'warning-outline' : 'notifications-outline'}
            size={16}
            color={isAlert ? colors.danger : colors.actionPrimary}
            style={styles.icon}
          />
          <Text style={[styles.senderText, { color: colors.textSecondary }]}>
            {item.senderName} ({item.audience})
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.actionPrimary }]} />}
        </View>
      </View>

      <Text style={[styles.subjectText, { color: colors.textPrimary }]} numberOfLines={1}>
        {item.subject}
      </Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.body}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  senderText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectText: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
