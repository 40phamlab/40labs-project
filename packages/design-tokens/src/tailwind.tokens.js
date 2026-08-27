// Import this into apps/core-desktop/tailwind.config.js under `theme.extend`.
const { colors, radius, fonts } = require('./src/index.ts');
module.exports = {
  colors: { primary: colors.primary, accent: colors.accent, danger: colors.danger, surface: colors.surface, 'surface-strong': colors.surfaceStrong },
  borderRadius: { card: radius.card, input: radius.input },
  fontFamily: { heading: [fonts.heading, 'sans-serif'], ui: [fonts.ui, 'sans-serif'], mono: [fonts.mono, 'monospace'] },
};
