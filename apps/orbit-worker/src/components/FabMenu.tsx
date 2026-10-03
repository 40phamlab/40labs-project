// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { useElevation } from '../theme/useElevation';
import { radius } from '@40labs/design-tokens';

export interface FabMenuItem {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
}

interface FabMenuProps {
  visible: boolean;
  onClose: () => void;
  items: FabMenuItem[];
  style?: ViewStyle;
}

export function FabMenu({ visible, onClose, items, style }: FabMenuProps) {
  const { colors } = useTheme();
  const raisedStyle = useElevation('raised');

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[
            styles.menu,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.borderSubtle,
            },
            raisedStyle,
            style,
          ]}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.item, { borderBottomColor: colors.divider, minHeight: 48 }]}
              onPress={() => {
                item.onPress();
                onClose();
              }}
              accessibilityLabel={item.label}
              accessibilityRole="button"
            >
              {item.icon && (
                <Ionicons name={item.icon} size={18} color={colors.textSecondary} style={styles.itemIcon} />
              )}
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 24,
  },
  menu: {
    width: 240,
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
