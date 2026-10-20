// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ListRowProps {
  title: string;
  subtitle?: string;
  rightText?: string;
  onPress?: () => void;
  icon?: string;
  style?: ViewStyle;
}

export function ListRow({ title, subtitle, rightText, onPress, icon, style }: ListRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.row,
        {
          backgroundColor: colors.tabPanel,
          borderBottomColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={colors.actionPrimary} style={styles.icon} />}
      <View style={styles.content}>
        <Text variant="body" style={styles.title}>{title}</Text>
        {subtitle && <Text variant="label" style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightText && <Text variant="mono" style={styles.rightText}>{rightText}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  icon: { marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 15 },
  subtitle: { fontSize: 12, marginTop: 2 },
  rightText: { fontSize: 14, marginRight: 8 },
  chevron: { marginLeft: 4 },
});
