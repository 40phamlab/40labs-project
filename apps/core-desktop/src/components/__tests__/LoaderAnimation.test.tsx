// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import {
  LoaderAnimation,
  getRecommendedLoaderVariant,
  useMinDisplayTime,
} from '../brand/LoaderAnimation';

describe('LoaderAnimation Component & Helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRecommendedLoaderVariant', () => {
    it('returns "instant" for estimated durations under threshold', () => {
      expect(getRecommendedLoaderVariant(500)).toBe('instant');
      expect(getRecommendedLoaderVariant(1999)).toBe('instant');
    });

    it('returns "long" for estimated durations at or above threshold', () => {
      expect(getRecommendedLoaderVariant(2000)).toBe('long');
      expect(getRecommendedLoaderVariant(5000)).toBe('long');
    });
  });

  describe('useMinDisplayTime', () => {
    it('returns true immediately when isLoading is true', () => {
      const { result } = renderHook(() => useMinDisplayTime(true, 200));
      expect(result.current).toBe(true);
    });

    it('holds true for minimum display duration when isLoading becomes false rapidly', () => {
      const { result, rerender } = renderHook(({ loading }) => useMinDisplayTime(loading, 200), {
        initialProps: { loading: true },
      });

      expect(result.current).toBe(true);

      // Fast response after 50ms
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ loading: false });

      // Should still be displaying (enforcing 200ms minimum)
      expect(result.current).toBe(true);

      // Advance remaining 150ms
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current).toBe(false);
    });

    it('turns false immediately if duration already exceeded minimum threshold', () => {
      const { result, rerender } = renderHook(({ loading }) => useMinDisplayTime(loading, 200), {
        initialProps: { loading: true },
      });

      // Task takes 300ms (exceeds 200ms minimum)
      act(() => {
        vi.advanceTimersByTime(300);
      });
      rerender({ loading: false });

      expect(result.current).toBe(false);
    });
  });

  describe('LoaderAnimation Component Rendering', () => {
    it('renders instant variant with role="status" and accessibility attributes', () => {
      const { container } = render(<LoaderAnimation variant="instant" label="Loading..." />);

      const statusEl = container.querySelector('[role="status"]');
      expect(statusEl).toBeDefined();
      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('renders long variant with custom size', () => {
      const { container } = render(<LoaderAnimation variant="long" size={64} label="Syncing database..." />);

      const statusEl = container.querySelector('[role="status"]');
      expect(statusEl).toBeDefined();
      expect(screen.getByText('Syncing database...')).toBeDefined();
    });
  });
});
