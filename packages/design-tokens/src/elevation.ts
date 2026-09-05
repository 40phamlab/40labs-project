// Source of truth: apps/core-desktop/CONTEXT/02-DESIGN-TOKENS.md → Elevation
// "Clinical Claymorphism" — tactile depth, not literal skeuomorphism.
// Dark-mode values are PLACEHOLDERS — see PROGRESS.md item #1.

export const elevation = {
  flat: 'none',
  raised:
    '0 1px 2px rgba(16,24,32,0.06), 0 4px 10px rgba(16,24,32,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
  hover:
    '0 2px 4px rgba(16,24,32,0.08), 0 6px 16px rgba(16,24,32,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
  pressed:
    'inset 0 2px 4px rgba(16,24,32,0.15), inset 0 -1px 0 rgba(255,255,255,0.4)',
  inset:
    'inset 0 1px 3px rgba(16,24,32,0.12), inset 0 -1px 0 rgba(255,255,255,0.5)',
  surfacePop: '0 4px 0 #252525, 0 8px 16px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08)',
  innerSoft: 'inset 0 2px 4px rgba(0,0,0,.4), inset 0 -1px 0 rgba(255,255,255,.04)',
} as const;

export type ElevationToken = keyof typeof elevation;

// TODO [dark-mode-elevation] [MVP]: dark variant blocked on
// PROGRESS.md item #1 (dark-mode surface palette not yet locked).
// Do not fill this in with guessed values.
export const elevationDark: Partial<Record<ElevationToken, string>> = {};