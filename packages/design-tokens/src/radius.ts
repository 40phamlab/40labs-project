// Source of truth for 40Labs Design Tokens: Border Radius
// Clinical, dense desktop-first rounded scale.

export const radius = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  card: '8px',
  input: '6px',
  full: '9999px',
  pill: '9999px',
} as const;

export type RadiusToken = keyof typeof radius;
