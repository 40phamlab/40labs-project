import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TrustedBySection } from './TrustedBySection';

describe('TrustedBySection', () => {
  it('renders exactly 4 slots', () => {
    const { container } = render(<TrustedBySection partners={[]} />);
    // There should be 4 slots in the grid
    const grid = container.querySelector('.grid');
    expect(grid?.children.length).toBe(4);
  });

  it('renders logo image when logoUrl is provided and empty state when absent without fake company names', () => {
    const customPartners = [
      { id: '1', name: 'Has Logo', logoUrl: 'https://example.com/logo.png' },
      { id: '2', name: 'No Logo Corp' },
    ];

    render(<TrustedBySection partners={customPartners} />);

    const img = screen.getByAltText('Has Logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png');

    // Ensure company name is NOT rendered as text inside the slots
    expect(screen.queryByText('No Logo Corp')).not.toBeInTheDocument();
  });

  it('handles odd partner counts or missing partners by padding up to 4 empty slots', () => {
    const threePartners = [
      { id: '1', name: 'P1', logoUrl: 'https://example.com/1.png' },
      { id: '2', name: 'P2', logoUrl: 'https://example.com/2.png' },
      { id: '3', name: 'P3', logoUrl: 'https://example.com/3.png' },
    ];

    const { container } = render(<TrustedBySection partners={threePartners} />);
    const grid = container.querySelector('.grid');
    expect(grid?.children.length).toBe(4);
  });

  it('applies responsive grid classes (grid-cols-2 md:grid-cols-4)', () => {
    const { container } = render(<TrustedBySection />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('md:grid-cols-4');
  });
});
