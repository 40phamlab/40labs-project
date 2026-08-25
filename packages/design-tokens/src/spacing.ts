// No custom spacing system — Tailwind's default 4px-base scale is used
// directly in className strings. This file exists only so code that needs
// a spacing value in JS/TS (not Tailwind classes) has one place to read it
// from, instead of a second parallel scale getting invented ad hoc.

export const spacingBaseUnit = 4; // px

export const spacing = {
  xs: spacingBaseUnit * 1,   // 4px
  sm: spacingBaseUnit * 2,   // 8px
  md: spacingBaseUnit * 4,   // 16px
  lg: spacingBaseUnit * 6,   // 24px
  xl: spacingBaseUnit * 8,   // 32px
  xxl: spacingBaseUnit * 12, // 48px
} as const;

export type SpacingToken = keyof typeof spacing;