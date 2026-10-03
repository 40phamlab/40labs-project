// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useElevation } from '../theme/useElevation';
import { radius } from '@40labs/design-tokens';

interface FabProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Fab({ label, icon = 'add', onPress, style, accessibilityLabel }: FabProps) {
  const { colors } = useTheme();
  const raisedStyle = useElevation('raised');

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.fab,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.borderDefault,
          minHeight: 48,
          minWidth: 48,
        },
        raisedStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={colors.accent} style={styles.icon} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
