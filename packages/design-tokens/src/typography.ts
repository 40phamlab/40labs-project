// Source of truth for 40Labs Design Tokens: Typography

export const fonts = {
  heading: 'Sora',         // Section headers, module titles
  ui: 'Inter',             // Primary interface text, controls, tables
  mono: 'JetBrains Mono',  // Prices, codes, lot/batch IDs, numeric metrics
} as const;

export const fontSizes = {
  '3xs': '9px',
  '2xs': '10px',
  xs: '11px',
  sm: '13px',
  base: '14px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typographyScale = {
  'title-page': {
    fontFamily: '"Sora", sans-serif',
    fontSize: '20px',
    lineHeight: '28px',
    fontWeight: '600',
  },
  'title-section': {
    fontFamily: '"Sora", sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '600',
  },
  'body': {
    fontFamily: '"Inter", sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
  },
  'ui-small': {
    fontFamily: '"Inter", sans-serif',
    fontSize: '13px',
    lineHeight: '18px',
    fontWeight: '500',
  },
  'label': {
    fontFamily: '"Inter", sans-serif',
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  'stat-number': {
    fontFamily: '"Sora", sans-serif',
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
  },
  'mono': {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '13px',
    lineHeight: '18px',
    fontVariantNumeric: 'tabular-nums',
  },
} as const;

export type FontToken = keyof typeof fonts;
export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
export type TypographyToken = keyof typeof typographyScale;
