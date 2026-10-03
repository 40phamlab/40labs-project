// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/00_OVERVIEW.md]
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAppFonts } from '../src/theme/fonts';
import { colors } from '@40labs/design-tokens';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceStrong, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.actionPrimary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceStrong } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pair" />
      </Stack>
    </>
  );
}
