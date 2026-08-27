// Source of truth: apps/core-desktop/CONTEXT/02-DESIGN-TOKENS.md
// Dark theme constants match the supplied Sales reference exactly enough to
// keep the entire desktop visually coherent. No surface uses pure white.
export const colors = {
  primary: '#39B54A', accent: '#F7931E', danger: '#EF4444',
  surface: '#1A1A1A', surfaceStrong: '#313131', panel: '#4D4D4D',
  panelStrong: '#494949', input: '#666666', field: '#BDCCD4',
  text: '#D7D7D7', textMuted: '#A9A9A9', border: '#606060',
} as const;
export type ColorToken = keyof typeof colors;
export const statusColors = {
  inStock: colors.primary, lowStock: colors.accent, expired: colors.danger,
  critical: colors.danger, synced: colors.primary, syncPending: colors.accent,
  syncFailed: colors.danger,
} as const;
export type StatusToken = keyof typeof statusColors;
