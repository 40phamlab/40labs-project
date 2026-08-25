export const radius = {
  card: '12px',   // cards, panels
  input: '8px',   // inputs, buttons, chips
} as const;

export type RadiusToken = keyof typeof radius;