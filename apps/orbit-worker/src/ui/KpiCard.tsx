// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { radius as r } from '../theme/rn-tokens';

interface KpiCardProps {
  label: string;
  value: string | number;
  style?: ViewStyle;
}

export function KpiCard({ label, value, style }: KpiCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.tabPanel,
          borderColor: colors.borderSubtle,
          borderRadius: r.card,
        },
        style,
      ]}
    >
      <Text variant="label" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.label}>{label}</Text>
      <Text variant="mono" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    minHeight: 80,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
  },
});
