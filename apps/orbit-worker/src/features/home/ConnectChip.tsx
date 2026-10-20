// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { useI18n } from '../../i18n/I18nProvider';

interface ConnectChipProps {
  status: 'unpaired' | 'connecting' | 'connected' | 'unreachable' | 'revoked';
  onPress: () => void;
}

export function ConnectChip({ status, onPress }: ConnectChipProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (status === 'connected') return null;

  const isConnecting = status === 'connecting';
  const isRevoked = status === 'revoked';
  const label = isRevoked ? 'Re-Pair' : t('pairing.scanToConnect');

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isConnecting}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: isRevoked ? colors.danger : colors.accent || '#F97316',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isConnecting ? (
        <ActivityIndicator size="small" color={colors.actionPrimary} />
      ) : (
        <>
          <Ionicons
            name="qr-code-outline"
            size={16}
            color={isRevoked ? colors.danger : colors.accent || '#F97316'}
            style={styles.icon}
          />
          <Text style={[styles.label, { color: isRevoked ? colors.danger : colors.textPrimary }]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
