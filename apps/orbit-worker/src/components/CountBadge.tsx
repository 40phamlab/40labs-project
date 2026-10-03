// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CountBadgeProps {
  count: number;
  accessibilityLabel?: string;
}

export function CountBadge({ count, accessibilityLabel }: CountBadgeProps) {
  const { colors } = useTheme();

  if (count <= 0) {
    return null;
  }

  const displayCount = count > 9 ? '9+' : String(count);

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.danger }]}
      accessibilityLabel={accessibilityLabel || `${count} notifications`}
      accessibilityRole="text"
    >
      <Text style={[styles.text, { color: colors.textInverse }]}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    minHeight: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});
