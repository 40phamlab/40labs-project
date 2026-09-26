import { invoke } from '@tauri-apps/api/core';

/**
 * Global flag controlling whether feature APIs route requests via Tauri IPC (Rust -> SQLx -> SQLite)
 * or fallback to in-memory devData mock stores.
 */
let useTauriIpcMode = false;

export function isTauriAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window)
  );
}

export function setUseTauriIpc(enable: boolean): void {
  useTauriIpcMode = enable;
}

export function isUsingTauriIpc(): boolean {
  return useTauriIpcMode && isTauriAvailable();
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
