// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pos]
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { radius } from '../../theme/rn-tokens';

interface PaymentSelectorProps {
  selected: 'cash' | 'mobile_money' | 'card';
  onSelect: (method: 'cash' | 'mobile_money' | 'card') => void;
}

export function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  const { colors } = useTheme();

  const methods: { id: 'cash' | 'mobile_money' | 'card'; label: string }[] = [
    { id: 'cash', label: 'Cash' },
    { id: 'mobile_money', label: 'Mobile Money' },
    { id: 'card', label: 'Card' },
  ];

  return (
    <View style={styles.container}>
      {methods.map((m) => {
        const isSelected = selected === m.id;
        return (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.btn,
              {
                backgroundColor: isSelected ? colors.actionPrimary : colors.surfaceSecondary,
                borderColor: isSelected ? colors.actionPrimary : colors.borderSubtle,
                borderRadius: radius.card,
              },
            ]}
            onPress={() => onSelect(m.id)}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.textOnDark : colors.textPrimary },
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  btn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
