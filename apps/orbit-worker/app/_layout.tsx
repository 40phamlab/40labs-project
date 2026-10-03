// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/00_OVERVIEW.md]
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAppFonts } from '../src/theme/fonts';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { I18nProvider } from '../src/i18n/I18nProvider';

function RootContent() {
  const fontsLoaded = useAppFonts();
  const { colors, theme } = useTheme();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceStrong, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.actionPrimary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceStrong } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pair" />
        <Stack.Screen name="stock" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RootContent />
      </I18nProvider>
    </ThemeProvider>
  );
}
