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
  args?: Record<string, unknown>,
  timeoutMs = 5000
): Promise<T> {
  if (isTauriAvailable()) {
    let timeoutId: number | undefined;
    try {
      const invokePromise = invoke<T>(command, args);
      const timeoutPromise = new Promise<never>((_, reject) =>
        timeoutId = window.setTimeout(
          () => reject(new Error(`Tauri IPC timeout for command: ${command}`)),
          timeoutMs,
        )
      );
      return await Promise.race([invokePromise, timeoutPromise]);
    } catch (error) {
      if (command === 'registration_commit') {
        console.error('[40Labs IPC Error] Registration command failed; see protected native registration diagnostics.');
      } else {
        console.error(`[40Labs IPC Error] Command "${command}" failed.`);
      }
      throw error;
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }
  throw new Error(`Tauri runtime unavailable for IPC command: ${command}`);
}
