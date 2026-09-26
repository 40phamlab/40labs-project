// Source of truth for 40Labs Design Tokens: Elevation & Shadows
// Tactile solid dark shadows without blurry glass or gradient artifacts.

export const elevation = {
  flat: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  md: '0 2px 6px rgba(0, 0, 0, 0.5)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.6)',
  raised: '0 2px 8px rgba(0, 0, 0, 0.5)',
  hover: '0 4px 12px rgba(0, 0, 0, 0.6)',
  pressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.7)',
  inset: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
  surfacePop: '0 4px 16px rgba(0, 0, 0, 0.7)',
  innerSoft: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
  skeuOuter: '0 2px 8px rgba(0, 0, 0, 0.5)',
  skeuInset: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
} as const;

export type ElevationToken = keyof typeof elevation;
