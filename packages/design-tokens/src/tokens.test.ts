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
});
