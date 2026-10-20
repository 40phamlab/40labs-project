// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import { spacing, radius as tokenRadius, fontSizes, iconSizes } from '@40labs/design-tokens';

export function px(val: string | number): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export const space = Object.fromEntries(
  Object.entries(spacing).map(([k, v]) => [k, px(v)])
) as Record<keyof typeof spacing, number>;

export const radius = Object.fromEntries(
  Object.entries(tokenRadius).map(([k, v]) => [k, px(v)])
) as Record<keyof typeof tokenRadius, number>;

export const font = Object.fromEntries(
  Object.entries(fontSizes).map(([k, v]) => [k, px(v)])
) as Record<keyof typeof fontSizes, number>;

export const icon = Object.fromEntries(
  Object.entries(iconSizes).map(([k, v]) => [k, px(v)])
) as Record<keyof typeof iconSizes, number>;

export const touch = {
  min: 48,
  input: 52,
  button: 52,
  chip: 40,
} as const;
