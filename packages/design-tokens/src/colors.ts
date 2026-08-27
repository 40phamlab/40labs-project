// Source of truth: apps/core-desktop/CONTEXT/02-DESIGN-TOKENS.md
// All application surfaces intentionally use soft/off-white tones; pure white
// is not used as a page or card background.

export const colors = {
  primary: '#16A34A',
  accent: '#F97316',
  danger: '#EF4444',
  surface: '#F1F5F2',
  surfaceStrong: '#F8FAF8',
} as const;

export type ColorToken = keyof typeof colors;
export const statusColors = {
  inStock: colors.primary, lowStock: colors.accent, expired: colors.danger,
  critical: colors.danger, synced: colors.primary, syncPending: colors.accent,
  syncFailed: colors.danger,
} as const;
export type StatusToken = keyof typeof statusColors;
