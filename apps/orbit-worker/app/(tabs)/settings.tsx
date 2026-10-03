// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#settings]
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ScreenHeader, Card } from '../../src/components';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('nav.settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.language')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, language === 'sw-TZ' && styles.activeBtn]}
              onPress={() => setLanguage('sw-TZ')}
            >
              <Text style={[styles.optionText, language === 'sw-TZ' && styles.activeText]}>Swahili (sw-TZ)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, language === 'en' && styles.activeBtn]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.optionText, language === 'en' && styles.activeText]}>English (en)</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.theme')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, theme === 'dark' && styles.activeBtn]}
              onPress={() => setTheme('dark')}
            >
              <Text style={[styles.optionText, theme === 'dark' && styles.activeText]}>{t('settings.dark')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, theme === 'light' && styles.activeBtn]}
              onPress={() => setTheme('light')}
            >
              <Text style={[styles.optionText, theme === 'light' && styles.activeText]}>{t('settings.light')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  activeBtn: {
    backgroundColor: colors.actionPrimary,
    borderColor: colors.borderSelected,
  },
  optionText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  activeText: {
    color: colors.textPrimary,
  },
});
