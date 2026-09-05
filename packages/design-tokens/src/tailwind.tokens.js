// Tailwind v4 bridge for the dark 40Labs desktop theme.
const { colors, radius, fonts } = require('./src/index.ts');
module.exports = {
  colors: {
    primary: colors.primary,
    accent: colors.accent,
    danger: colors.danger,
    surface: colors.surface,
    'surface-strong': colors.surfaceStrong,
    panel: colors.panel,
    'panel-strong': colors.panelStrong,
    input: colors.input,
    field: colors.field,
    text: colors.text,
    'text-muted': colors.textMuted,
    border: colors.border,
  },
  borderRadius: {
    card: radius.card,
    input: radius.input
  },
  fontFamily: { 
    heading: [fonts.heading, 'sans-serif'],
    ui: [fonts.ui, 'sans-serif'],
    mono: [fonts.mono, 'monospace']
  },
};
