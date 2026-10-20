// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { radius as r } from '../theme/rn-tokens';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: colors.tabPanel,
            color: colors.textPrimary,
            borderColor: error ? colors.danger : isFocused ? colors.borderFocus : colors.borderSubtle,
            borderRadius: r.input,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
});
