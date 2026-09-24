// Source of truth for 40Labs Design Tokens: Spacing Scale
// Dense 4px base scale for clinical desktop layouts.

export const spacingBaseUnit = 4; // px

export const spacing = {
  '3xs': '2px',
  '2xs': '4px',
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
  grid: 40, // 40px grid spacing for background patterns
} as const;

export type SpacingToken = keyof typeof spacing;
