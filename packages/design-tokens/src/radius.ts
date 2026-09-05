export const radius = {
  card: '12px',
  input: '8px',
} as const;

export type RadiusToken = keyof typeof radius;
