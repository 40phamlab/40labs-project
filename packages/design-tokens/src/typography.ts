// Source of truth for 40Labs Design Tokens: Typography

export const fonts = {
  heading: 'Sora',         // Section headers, module titles
  ui: 'Inter',             // Primary interface text, controls, tables
  mono: 'JetBrains Mono',  // Prices, codes, lot/batch IDs, numeric metrics
} as const;

export const fontSizes = {
  '3xs': '9px',
  '2xs': '10px',
  xs: '12px',
  sm: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '24px',
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontToken = keyof typeof fonts;
export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
