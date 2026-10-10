import { isTauriAvailable } from '../api/client';

export function logAuthDebug(method: string, durationMs: number, success: boolean, errorCode?: string) {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    const status = success ? 'ok' : (errorCode || 'error');
    console.log(`[40Labs AUTH] ${method} -> ${status} (${durationMs}ms)`);
  }
}

export function printBootBanner() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    const backend = isTauriAvailable() ? 'TAURI-IPC' : 'MOCK';
    console.log(`[40Labs AUTH] backend = ${backend}`);
  }
}
