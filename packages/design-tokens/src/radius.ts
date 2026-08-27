export const radius = {
  card: '18px',
  input: '14px',
} as const;

export type RadiusToken = keyof typeof radius;
