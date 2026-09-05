export * from './colors';
export * from './typography';
export * from './radius';
export * from './spacing';
export * from './elevation';

// Convenience combined export — import { tokens } from '@40labs/design-tokens'
import { colors, statusColors } from './colors';
import { fonts, fontSizes } from './typography';
import { radius } from './radius';
import { spacing } from './spacing';
import { elevation } from './elevation';

export const tokens = {
  colors,
  statusColors,
  fonts,
  fontSizes,
  radius,
  spacing,
  elevation,
} as const;