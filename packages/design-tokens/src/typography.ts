export const fonts = {
  heading: 'Sora',         // page titles, section headers
  ui: 'Inter',             // body text, labels, buttons
  mono: 'JetBrains Mono',  // prices, codes, batch/lot IDs, Business IDs
} as const;

export type FontToken = keyof typeof fonts;