// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
export const layout = {
  headerContentHeight: 48,
  cardPadding: 16,
  cardRadius: 12,
  fontSizes: {
    heading: 18,
    body: 14,
    caption: 12,
    kpiValue: 20,
  },
  breakpoints: {
    tablet: 768,
  },
  gridColumns: {
    phone: 2,
    tablet: 3,
  },
} as const;
