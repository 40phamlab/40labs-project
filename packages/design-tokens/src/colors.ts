// Source of truth: apps/core-desktop/CONTEXT/02-DESIGN-TOKENS.md
// If this file and that markdown ever disagree, THIS FILE WINS —
// update the markdown to match, not the other way around.

export const colors = {
  primary: '#16A34A', // brand, success, in-stock, synced
  accent: '#F97316',  // secondary actions, warnings, low-stock, sync-pending
  danger: '#EF4444',  // destructive, expired, critical, sync-failed
  surface: '#F8FAFB', // light-mode background
} as const;

export type ColorToken = keyof typeof colors;

// Dark mode surface palette — NOT YET LOCKED.
// Do not add a dark background hex here until PROGRESS.md item #1 is resolved.
// Placeholder intentionally omitted rather than guessed.

// Semantic status mapping — ALWAYS route through this, never invent a new hex
// for a new "state." If a screen needs a status color not listed here, that's
// a signal to add it here first, not to hardcode locally.
export const statusColors = {
  inStock: colors.primary,
  lowStock: colors.accent,
  expired: colors.danger,
  critical: colors.danger,
  synced: colors.primary,
  syncPending: colors.accent,
  syncFailed: colors.danger,
} as const;

export type StatusToken = keyof typeof statusColors;