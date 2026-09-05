export const fonts = {
  heading: 'Sora',         // page titles, section headers
  ui: 'Inter',             // body text, labels, buttons
  mono: 'JetBrains Mono',  // prices, codes, batch/lot IDs, Business IDs
} as const;

export const fontSizes = {
  tiny: '9px',
  caption: '10px',
  xs: '12px',
  sm: '14px',
  base: '16px',
} as const;

export type FontToken = keyof typeof fonts;
export type FontSizeToken = keyof typeof fontSizes;
