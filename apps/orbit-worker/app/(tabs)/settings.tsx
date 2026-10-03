// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#settings]
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t('settings.language')}: {language}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setLanguage(language === 'sw-TZ' ? 'en' : 'sw-TZ')}
          testID="lang-toggle"
        >
          <Text style={styles.buttonText}>{language === 'sw-TZ' ? 'Switch to English' : 'Badili kwenda Swahili'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('settings.theme')}: {theme}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          testID="theme-toggle"
        >
          <Text style={styles.buttonText}>{theme === 'dark' ? t('settings.light') : t('settings.dark')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.actionPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
});
