export * from './colors';
export * from './typography';
export * from './radius';
export * from './spacing';
export * from './elevation';

// Convenience combined export — import { tokens } from '@40labs/design-tokens'
import { colors, statusColors, darkColors } from './colors';
import { fonts, fontSizes } from './typography';
import { radius, darkRadius } from './radius';
import { spacing } from './spacing';
import { elevation, darkElevation } from './elevation';

export const tokens = {
  colors,
  statusColors,
  fonts,
  fontSizes,
  radius,
  spacing,
  elevation,
} as const;

export const darkTokens = {
  colors: darkColors,
  fonts,
  fontSizes,
  radius: darkRadius,
  spacing,
  elevation: darkElevation,
} as const;
