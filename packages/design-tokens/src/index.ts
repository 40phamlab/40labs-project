export * from './colors';
export * from './typography';
export * from './radius';
export * from './spacing';
export * from './elevation';
export * from './layout';

import { colors, statusColors } from './colors';
import { fonts, fontSizes, fontWeights } from './typography';
import { radius } from './radius';
import { spacing } from './spacing';
import { elevation } from './elevation';
import { controlHeights, iconSizes, layoutWidths } from './layout';

export const tokens = {
  colors,
  statusColors,
  fonts,
  fontSizes,
  fontWeights,
  radius,
  spacing,
  elevation,
  controlHeights,
  iconSizes,
  layoutWidths,
} as const;

export const darkTokens = tokens;
