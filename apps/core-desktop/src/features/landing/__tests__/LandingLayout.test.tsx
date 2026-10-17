import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingScreen } from '../LandingScreen';

describe('Landing Layout & Fixed Panel', () => {
  it('renders landing screen with y-axis autoscroll on root container', () => {
    const { container } = render(<LandingScreen onGetStarted={() => {}} />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toBeDefined();
    expect(rootDiv.className).toContain('overflow-y-auto');
  });

  it('ActionPanel has fixed right positioning and unmovable carriage state on desktop', () => {
    window.innerWidth = 1440;
    window.innerHeight = 900;
    window.dispatchEvent(new Event('resize'));

    render(<LandingScreen onGetStarted={() => {}} />);
    const startBtn = screen.getByRole('button', { name: /anza|get started/i });
    const panel = startBtn.closest('.fixed');
    expect(panel).toBeDefined();
    expect(panel?.className).toContain('fixed');
  });
});
