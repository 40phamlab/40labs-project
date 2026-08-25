// Import this into apps/core-desktop/tailwind.config.js under `theme.extend`
// so Tailwind classes (bg-primary, text-danger, rounded-card, etc.) resolve
// to the exact same values as the TS tokens — one source, two consumers.

const { colors, radius, fonts } = require('./src/index.ts');

module.exports = {
  colors: {
    primary: colors.primary,
    accent: colors.accent,
    danger: colors.danger,
    surface: colors.surface,
  },
  borderRadius: {
    card: radius.card,
    input: radius.input,
  },
  fontFamily: {
    heading: [fonts.heading, 'sans-serif'],
    ui: [fonts.ui, 'sans-serif'],
    mono: [fonts.mono, 'monospace'],
  },
};