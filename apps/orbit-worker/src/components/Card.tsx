// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useElevation } from '../theme/useElevation';
import { radius } from '@40labs/design-tokens';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Card({ children, style, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const raisedStyle = useElevation('raised');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.borderSubtle,
        },
        raisedStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
  },
});
