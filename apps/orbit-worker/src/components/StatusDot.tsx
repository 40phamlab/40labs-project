// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type StatusDotState = 'connected' | 'connecting' | 'offline' | 'revoked';

interface StatusDotProps {
  state: StatusDotState;
  label?: string;
  accessibilityLabel?: string;
}

export function StatusDot({ state, label, accessibilityLabel }: StatusDotProps) {
  const { colors } = useTheme();

  const getColor = () => {
    switch (state) {
      case 'connected':
        return colors.success;
      case 'connecting':
        return colors.warning;
      case 'revoked':
        return colors.danger;
      case 'offline':
      default:
        return colors.textMuted;
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel || `Status: ${state}`}
      accessibilityRole="image"
    >
      <View style={[styles.dot, { backgroundColor: getColor() }]} />
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
