// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { px, space, radius, font, icon, touch } from '../src/theme/rn-tokens';
import { useResponsive } from '../src/theme/useResponsive';

describe('rn-tokens px parsing', () => {
  it('correctly parses string and number pixel values', () => {
    expect(px('12px')).toBe(12);
    expect(px(16)).toBe(16);
    expect(px('2rem')).toBe(2);
    expect(px('invalid')).toBe(0);
  });

  it('exports numeric scale objects', () => {
    expect(typeof space.sm).toBe('number');
    expect(typeof radius.card).toBe('number');
    expect(typeof font.base).toBe('number');
    expect(typeof icon.md).toBe('number');
    expect(touch.input).toBe(52);
    expect(touch.button).toBe(52);
    expect(touch.chip).toBe(40);
  });
});

describe('useResponsive breakpoints', () => {
  it('identifies breakpoints correctly based on window width', () => {
    const { result } = renderHook(() => useResponsive());
    expect(result.current.bp).toBeDefined();
    expect(typeof result.current.columns).toBe('number');
  });
});
