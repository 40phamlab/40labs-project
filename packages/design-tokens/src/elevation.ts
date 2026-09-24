// Source of truth for 40Labs Design Tokens: Elevation
// Tactile solid surface depth for dark desktop interface.

export const elevation = {
  flat: 'none',
  raised: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  hover: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
  pressed: 'inset 0 2px 4px rgba(0,0,0,0.6)',
  inset: 'inset 0 1px 3px rgba(0,0,0,0.5)',
  surfacePop: '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
  innerSoft: 'inset 0 2px 4px rgba(0,0,0,0.5)',
} as const;

export const darkElevation = {
  skeuOuter: '0 4px 12px rgba(0,0,0,0.5)',
  skeuInset: 'inset 0 1px 0 rgba(255,255,255,0.08)',
} as const;

export type ElevationToken = keyof typeof elevation;
export type DarkElevationToken = keyof typeof darkElevation;
