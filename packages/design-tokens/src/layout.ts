// Source of truth for 40Labs Design Tokens: Layout & Controls Dimensions
// Dense desktop-first component dimensions.

export const controlHeights = {
  xs: '24px',
  sm: '28px',
  md: '32px',
  lg: '40px',
} as const;

export const iconSizes = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '24px',
} as const;

export const layoutWidths = {
  sidebarCollapsed: '56px',
  sidebarExpanded: '240px',
  subnav: '220px',
  panelSm: '280px',
  panelMd: '320px',
  panelLg: '400px',
} as const;

export type ControlHeightToken = keyof typeof controlHeights;
export type IconSizeToken = keyof typeof iconSizes;
export type LayoutWidthToken = keyof typeof layoutWidths;
