export const WORKSPACE_ID = 'ws_dev_001';
export const BRANCH_ID = 'br_dev_001';

export const nowIso = (): string => new Date().toISOString();
export const daysAgoIso = (n: number): string => new Date(Date.now() - n * 86400000).toISOString();
export const daysFromNowIso = (n: number): string => new Date(Date.now() + n * 86400000).toISOString();
