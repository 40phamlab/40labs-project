// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useElevation } from '../theme/useElevation';
import { radius } from '@40labs/design-tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Chip({ label, selected = false, onPress, style, accessibilityLabel }: ChipProps) {
  const { colors } = useTheme();
  const pressedStyle = useElevation('pressed');
  const raisedStyle = useElevation('raised');

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.surfaceSelected : colors.input,
          borderColor: selected ? colors.borderSelected : colors.borderSubtle,
          minHeight: 48,
          minWidth: 48,
        },
        selected ? pressedStyle : raisedStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.accent : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
