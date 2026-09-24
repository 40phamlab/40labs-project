// Source of truth for 40Labs Design Tokens: Colors
// Solid, high-contrast, professional clinical dark desktop palette. No gradients, no glassmorphism.

export const colors = {
  // Application shell
  appBg: '#0B0F0D',
  topChrome: '#121815',
  sidebar: '#121815',

  // Solid Surfaces
  surfacePrimary: '#1A221E',
  surfaceSecondary: '#222C27',
  surfaceElevated: '#2A3630',
  surfaceHover: '#26322C',
  surfaceActive: '#2E3C35',
  surfaceSelected: '#1E382B',
  surfaceDisabled: '#161E1A',

  // Borders & Dividers
  borderSubtle: '#243029',
  borderDefault: '#28362E',
  borderStrong: '#384B41',
  borderFocus: '#16A34A',
  borderSelected: '#22C55E',
  divider: '#243029',

  // Typography Colors
  textPrimary: '#F8FAFB',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDisabled: '#52635A',
  textInverse: '#0B0F0D',

  // Primary Actions
  actionPrimary: '#16A34A',
  actionPrimaryHover: '#15803D',
  actionPrimaryActive: '#166534',

  // Semantic Feedback & Clinical Status
  success: '#16A34A',
  successBg: '#12281C',
  successBorder: '#1A4D2E',

  warning: '#F97316',
  warningBg: '#2C1D11',
  warningBorder: '#5C2D0C',

  danger: '#EF4444',
  dangerBg: '#2B1718',
  dangerBorder: '#5C1D1F',

  info: '#0EA5E9',
  infoBg: '#102331',
  infoBorder: '#154562',

  // Focus & State
  focusRing: '#16A34A',
  gridLines: 'rgba(255,255,255,0.03)',

  // Backward compatibility legacy aliases
  surface: '#0B0F0D',
  surfaceStrong: '#121815',
  panel: '#1A221E',
  panelStrong: '#222C27',
  input: '#161E1A',
  field: '#161E1A',
  textOnField: '#F8FAFB',
  text: '#F8FAFB',
  primary: '#16A34A',
  accent: '#F97316',
  border: '#28362E',
} as const;

export type ColorToken = keyof typeof colors;

export const statusColors = {
  inStock: colors.success,
  lowStock: colors.warning,
  expired: colors.danger,
  critical: colors.danger,
  synced: colors.success,
  syncPending: colors.warning,
  syncFailed: colors.danger,
} as const;

export type StatusToken = keyof typeof statusColors;
