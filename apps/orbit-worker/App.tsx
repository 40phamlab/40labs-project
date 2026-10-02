// [PHASE: MVP]
// [SPEC: apps/core-desktop/CONTEXT/05-LAN-ORBIT.md]
import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { t, Language } from '@40labs/i18n';
import { colors } from '@40labs/design-tokens';
import type { Business } from '@40labs/types';
import { useAppFonts } from './src/theme/fonts';
import { Icon } from './src/components/Icon';
import { elevationStyles } from './src/theme/elevation';

const LANG_STORAGE_KEY = 'orbit_worker_lang';

export default function App() {
  const fontsLoaded = useAppFonts();
  const [lang, setLang] = useState<Language>('sw');

  useEffect(() => {
    SecureStore.getItemAsync(LANG_STORAGE_KEY).then((stored) => {
      if (stored === 'sw' || stored === 'en') {
        setLang(stored);
      }
    });
  }, []);

  const toggleLang = async () => {
    const nextLang: Language = lang === 'sw' ? 'en' : 'sw';
    setLang(nextLang);
    await SecureStore.setItemAsync(LANG_STORAGE_KEY, nextLang);
  };

  const _sampleBusiness: Partial<Business> = {
    name: '40Labs Pharmacy LAN Worker',
  };

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-app-bg items-center justify-center">
        <ActivityIndicator size="large" color={colors.actionPrimary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-bg items-center justify-center p-6">
      <StatusBar style="light" />

      {/* Heading in Sora */}
      <Text className="font-heading text-2xl text-text-primary mb-2 text-center">
        {t('dashboard.title', lang)}
      </Text>
      <Text className="font-ui text-sm text-text-secondary mb-6 text-center">
        {_sampleBusiness.name}
      </Text>

      {/* Elevated Card */}
      <View
        style={[elevationStyles.raised, { backgroundColor: colors.surfaceElevated }]}
        className="w-full max-w-sm rounded-card p-6 mb-6 border border-border-subtle"
      >
        <View className="flex-row items-center mb-4">
          <Icon name="shield-checkmark" size={28} color={colors.actionPrimary} />
          <View className="ml-3">
            <Text className="font-ui text-base text-text-primary font-semibold">
              {t('dashboard.businessHealth', lang)}
            </Text>
            <Text className="font-mono text-xs text-text-muted">
              TZS 45,000
            </Text>
          </View>
        </View>

        <Text className="font-ui text-sm text-text-secondary">
          {t('dashboard.nothingPending', lang)}
        </Text>
      </View>

      {/* Language Toggle Button */}
      <TouchableOpacity
        onPress={toggleLang}
        style={{ backgroundColor: colors.actionPrimary }}
        className="px-6 py-3 rounded-card items-center justify-center"
      >
        <Text className="font-ui text-text-primary font-semibold">
          Lugha / Language: {lang.toUpperCase()} (Tap to switch)
        </Text>
      </TouchableOpacity>
    </View>
  );
}
