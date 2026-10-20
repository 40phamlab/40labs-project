import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface PinnedNativeResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface OrbitPinnedTransportNativeModule {
  request(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string | null,
    fingerprint: string,
  ): Promise<PinnedNativeResponse>;
}

let nativeModule: OrbitPinnedTransportNativeModule | null = null;
try {
  if (Platform.OS !== 'web') {
    nativeModule = requireNativeModule<OrbitPinnedTransportNativeModule>('OrbitPinnedTransport');
  }
} catch {
  // Native module unavailable (e.g. web or Expo Go)
}

export default nativeModule;
