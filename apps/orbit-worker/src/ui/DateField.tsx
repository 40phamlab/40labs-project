// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { TextField } from './TextField';
import { BottomSheet } from './BottomSheet';
import { radius as r } from '../theme/rn-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface DateFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  error?: string;
}

export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [textVal, setTextVal] = useState(value);

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
        <Text style={{ color: value ? colors.textPrimary : colors.textMuted }}>
          {value || 'YYYY-MM-DD'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <TextField
          label="Date (YYYY-MM-DD)"
          value={textVal}
          onChangeText={setTextVal}
          placeholder="2026-10-02"
        />
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.actionPrimary, borderRadius: r.card }]}
          onPress={() => {
            onChange(textVal);
            setOpen(false);
          }}
        >
          <Text style={{ color: colors.textOnDark, fontFamily: 'Inter_600SemiBold' }}>Set Date</Text>
        </TouchableOpacity>
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
  confirmBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  error: { fontSize: 12, marginTop: 4 },
});
