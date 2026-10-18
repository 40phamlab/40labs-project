import { describe, it, expect } from 'vitest';
import { LANDING_SLIDES } from '../lib/slides';

describe('Landing Carousel Slides & Badges', () => {
  it('has exactly 7 slides', () => {
    expect(LANDING_SLIDES.length).toBe(7);
  });

  it('has [SOON] badge on exactly slides 6 and 7 (indices 5 and 6)', () => {
    expect(LANDING_SLIDES[0].soon).toBeUndefined();
    expect(LANDING_SLIDES[1].soon).toBeUndefined();
    expect(LANDING_SLIDES[2].soon).toBeUndefined();
    expect(LANDING_SLIDES[3].soon).toBeUndefined();
    expect(LANDING_SLIDES[4].soon).toBeUndefined();
    expect(LANDING_SLIDES[5].soon).toBe(true);
    expect(LANDING_SLIDES[6].soon).toBe(true);
  });
});
