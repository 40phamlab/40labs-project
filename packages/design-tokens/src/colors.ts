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
  bg: '#0B0F0D',
  highlight: '#22C55E',
} as const;

export type ColorToken = keyof typeof colors;

export const lightColors = {
  appBg: '#E4E9EC',
  topChrome: '#EDF1F3',
  sidebar: '#EDF1F3',

  surfacePrimary: '#F3F6F8',
  surfaceSecondary: '#F7F9FA',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#EAEEF2',
  surfaceActive: '#E2E7EC',
  surfaceSelected: '#D8E2E9',
  surfaceDisabled: '#E8ECEF',

  borderSubtle: '#C5CED4',
  borderDefault: '#B6C2CC',
  borderStrong: '#99AAB8',
  borderFocus: '#16A34A',
  borderSelected: '#22C55E',
  divider: '#C5CED4',

  textPrimary: '#1F2A33',
  textSecondary: '#4A5568',
  textMuted: '#55636E',
  textDisabled: '#9AA5B1',
  textInverse: '#F8FAFB',

  actionPrimary: '#16A34A',
  actionPrimaryHover: '#15803D',
  actionPrimaryActive: '#166534',

  success: '#16A34A',
  successBg: '#E6F4EA',
  successBorder: '#CEEAD6',

  warning: '#F97316',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',

  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',

  info: '#0EA5E9',
  infoBg: '#E0F2FE',
  infoBorder: '#BAE6FD',

  focusRing: '#16A34A',
  gridLines: 'rgba(0,0,0,0.03)',

  surface: '#E4E9EC',
  surfaceStrong: '#EDF1F3',
  panel: '#F3F6F8',
  panelStrong: '#F7F9FA',
  input: '#DCE3E7',
  field: '#DCE3E7',
  textOnField: '#1F2A33',
  text: '#1F2A33',
  primary: '#16A34A',
  accent: '#F97316',
  border: '#C5CED4',
  bg: '#E4E9EC',
  highlight: '#22C55E',
} as const;

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
