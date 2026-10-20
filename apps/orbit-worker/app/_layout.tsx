// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/00_OVERVIEW.md]
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppFonts } from '../src/theme/fonts';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { useConnectionStore } from '../src/stores/connection';
import { Screen, AppHeader, Text, Button } from '../src/ui';

const queryClient = new QueryClient();

function RevokedState() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Screen scrollable={false}>
      <AppHeader title="Device Access Revoked" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text variant="heading" style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}>
          Device Access Revoked
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 24, color: colors.textSecondary }}>
          This device's pairing has been revoked by the desktop hub administrator. Please re-pair to continue.
        </Text>
        <Button
          title="Re-Pair Device"
          onPress={() => router.replace('/pair')}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </View>
    </Screen>
  );
}

function RootContent() {
  const fontsLoaded = useAppFonts();
  const { colors, theme } = useTheme();
  const { status } = useConnectionStore();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceStrong, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.actionPrimary} />
      </View>
    );
  }

  if (status === 'revoked') {
    return <RevokedState />;
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceStrong } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pair" />
        <Stack.Screen name="stock" />
        <Stack.Screen name="lab-sample" />
        <Stack.Screen name="lab-result" />
        <Stack.Screen name="pos" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <RootContent />
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
