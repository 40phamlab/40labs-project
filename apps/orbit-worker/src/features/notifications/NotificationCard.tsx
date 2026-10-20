// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius } from '../../theme/rn-tokens';
import { Text } from '../../ui/Text';
import { StaffNotificationItem } from './types';

interface NotificationCardProps {
  item: StaffNotificationItem;
  onPress: () => void;
}

function getInitials(name?: string): string {
  if (!name) return 'NT';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function NotificationCard({ item, onPress }: NotificationCardProps) {
  const { colors } = useTheme();
  const isAlert = item.severity === 'alert' || item.audience === 'alert';
  const initials = getInitials(item.senderName);

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
          <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.avatarText, { color: colors.actionPrimary }]}>{initials}</Text>
          </View>
          <View>
            <Text style={[styles.senderText, { color: colors.textSecondary }]}>
              {item.senderName} ({item.audience})
            </Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.actionPrimary }]} />}
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
    marginBottom: 8,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  senderText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
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
