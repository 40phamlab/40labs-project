export const radius = {
  card: '12px',
  input: '8px',
} as const;

export const darkRadius = {
  pill: '9999px',
  card: '16px',
} as const;

export type RadiusToken = keyof typeof radius;
export type DarkRadiusToken = keyof typeof darkRadius;
