// Source of truth for 40Labs Design Tokens: Colors
// Solid, high-contrast dark healthcare desktop palette. No pure white backgrounds.

export const colors = {
  primary: '#16A34A',
  accent: '#F97316',
  danger: '#EF4444',
  surface: '#0B0F0D',
  surfaceStrong: '#121815',
  panel: '#1A221E',
  panelStrong: '#222C27',
  input: '#161E1A',
  field: '#161E1A',
  textOnField: '#F8FAFB',
  text: '#F8FAFB',
  textMuted: '#94A3B8',
  border: '#28362E',
  borderStrong: '#384B41',
} as const;

export const darkColors = {
  bg: '#0B0F0D',
  surface: '#121815',
  panel: '#1A221E',
  panelStrong: '#222C27',
  raised: '#222C27',
  highlight: '#16A34A',
  accent: '#F97316',
  text: '#F8FAFB',
  textMuted: '#94A3B8',
  border: '#28362E',
  gridLines: 'rgba(255,255,255,0.03)',
} as const;

export type ColorToken = keyof typeof colors;
export type DarkColorToken = keyof typeof darkColors;

export const statusColors = {
  inStock: colors.primary,
  lowStock: colors.accent,
  expired: colors.danger,
  critical: colors.danger,
  synced: colors.primary,
  syncPending: colors.accent,
  syncFailed: colors.danger,
} as const;

export type StatusToken = keyof typeof statusColors;
