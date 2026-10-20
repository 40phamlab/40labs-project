// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { BottomSheet } from './BottomSheet';
import { radius as r } from '../theme/rn-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: Option[];
  onSelect: (value: string) => void;
  error?: string;
}

export function SelectField({ label, value, options, onSelect, error }: SelectFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text variant="label" style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: colors.tabPanel,
            borderColor: error ? colors.danger : colors.borderSubtle,
            borderRadius: r.input,
          },
        ]}
      >
        <Text style={{ color: selectedOption ? colors.textPrimary : colors.textMuted }}>
          {selectedOption ? selectedOption.label : 'Select...'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, opt.value === value && { backgroundColor: colors.surfaceHover }]}
            onPress={() => {
              onSelect(opt.value);
              setOpen(false);
            }}
          >
            <Text style={{ color: opt.value === value ? colors.actionPrimary : colors.textPrimary }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 6 },
  field: {
    height: 52,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  error: { fontSize: 12, marginTop: 4 },
});
