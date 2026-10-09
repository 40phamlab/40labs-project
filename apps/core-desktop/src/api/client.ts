import { invoke } from '@tauri-apps/api/core';

export function isTauriAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window)
  );
}

export function isUsingTauriIpc(): boolean {
  return isTauriAvailable();
}

/**
 * Safely invokes a Tauri IPC command when running inside the Tauri window shell.
 */
export async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (isTauriAvailable()) {
    try {
      return await invoke<T>(command, args);
    } catch (error) {
      console.error(`[40Labs IPC Error] Command "${command}" failed:`, error);
      throw error;
    }
  }
  throw new Error(`Tauri runtime unavailable for IPC command: ${command}`);
}
