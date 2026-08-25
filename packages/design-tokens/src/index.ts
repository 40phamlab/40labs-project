export * from './colors';
export * from './typography';
export * from './radius';
export * from './spacing';

// Convenience combined export — import { tokens } from '@40labs/design-tokens'
import { colors, statusColors } from './colors';
import { fonts } from './typography';
import { radius } from './radius';
import { spacing } from './spacing';

export const tokens = {
  colors,
  statusColors,
  fonts,
  radius,
  spacing,
} as const;