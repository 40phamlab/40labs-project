import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { colors, lightColors } from './colors';
import { radius } from './radius';

const css = readFileSync(resolve(process.cwd(), 'packages/design-tokens/tokens.css'), 'utf8');
const declaredColorTokens = new Set(
  [...css.matchAll(/--color-([\w-]+)\s*:/g)].map((match) => match[1]),
);

const toKebabCase = (value: string) => value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function getLuminance(hex: string): number {
  const normalizedHex = hex.replace('#', '');
  const r = parseInt(normalizedHex.substring(0, 2), 16) / 255;
  const g = parseInt(normalizedHex.substring(2, 4), 16) / 255;
  const b = parseInt(normalizedHex.substring(4, 6), 16) / 255;
  const transform = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

describe('design token parity', () => {
  test('every TypeScript color token has a Tailwind CSS color token', () => {
    const missing = [...new Set([...Object.keys(colors), ...Object.keys(lightColors)])]
      .map(toKebabCase)
      .filter((token) => !declaredColorTokens.has(token));

    expect(missing).toEqual([]);
  });

  test('the canonical card radius matches the Tailwind CSS token', () => {
    expect(radius.card).toBe('12px');
    expect(css).toMatch(/--radius-card:\s*12px\s*;/);
    expect(css).toMatch(/--radius-card-md:\s*12px\s*;/);
  });

  test('tab layer ladder light values equal previous resolved values', () => {
    expect(lightColors.tabContainer).toBe('#E4E9EC');
    expect(lightColors.tabPanel).toBe('#F3F6F8');
    expect(lightColors.tabPanelStrong).toBe('#F7F9FA');
  });

  test('WCAG contrast between adjacent dark layers appBg -> tabContainer -> tabPanel -> tabPanelStrong is >= 1.10 each', () => {
    const contrast1 = getContrastRatio(colors.appBg, colors.tabContainer);
    const contrast2 = getContrastRatio(colors.tabContainer, colors.tabPanel);
    const contrast3 = getContrastRatio(colors.tabPanel, colors.tabPanelStrong);

    expect(contrast1).toBeGreaterThanOrEqual(1.10);
    expect(contrast2).toBeGreaterThanOrEqual(1.10);
    expect(contrast3).toBeGreaterThanOrEqual(1.10);
  });
});
