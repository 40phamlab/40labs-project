// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React, { useState, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function FormSection({ title, children, defaultExpanded = true }: FormSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.section, { backgroundColor: colors.tabContainer, borderColor: colors.borderSubtle }]}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
        accessibilityRole="button"
      >
        <Text variant="heading" style={{ fontSize: 16 }}>{title}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
