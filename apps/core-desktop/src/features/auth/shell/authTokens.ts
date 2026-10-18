/**
 * Auth Shell Design Tokens Composition
 * Strictly composes existing design tokens without introducing new color values.
 */
export const authTokens = {
  colors: {
    green: '#16A34A',
    orange: '#F97316',
    danger: '#EF4444',
    surface: '#F8FAFB',
  },
  typography: {
    heading: 'font-sora',
    sans: 'font-sans',
    mono: 'font-mono',
  },
  radius: {
    card: 'rounded-[12px]',
    input: 'rounded-[8px]',
    hex: 'rounded-[6px]',
  },
} as const;
