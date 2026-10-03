// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, AppState } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface PinPadProps {
  visible: boolean;
  title?: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

export function PinPad({ visible, title = 'Enter PIN', onConfirm, onCancel }: PinPadProps) {
  const [pin, setPin] = useState('');

  // Clear PIN on background or close
  useEffect(() => {
    if (!visible) {
      setPin('');
    }
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setPin('');
        onCancel();
      }
    });
    return () => sub.remove();
  }, [visible, onCancel]);

  const handlePress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length >= 4) {
      onConfirm(pin);
      setPin('');
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Required for authorization</Text>

          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i < pin.length ? colors.actionPrimary : colors.surfaceSecondary,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.grid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((btn) => (
              <TouchableOpacity
                key={btn}
                style={[styles.btn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}
                onPress={() => {
                  if (btn === 'C') handleDelete();
                  else if (btn === 'OK') handleSubmit();
                  else handlePress(btn);
                }}
              >
                <Text style={[styles.btnText, { color: colors.textPrimary }]}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: 300,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 20,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
