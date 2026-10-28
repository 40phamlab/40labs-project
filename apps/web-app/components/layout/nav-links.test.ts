import { describe, it, expect } from 'vitest';
import { isNavActive } from './nav-links';

describe('isNavActive', () => {
  it('correctly matches exact path for home (/)', () => {
    expect(isNavActive('/', '/')).toBe(true);
    expect(isNavActive('/products', '/')).toBe(false);
  });

  it('correctly matches exact or nested paths for other routes', () => {
    expect(isNavActive('/products', '/products')).toBe(true);
    expect(isNavActive('/products/123', '/products')).toBe(true);
    expect(isNavActive('/product', '/products')).toBe(false);

    expect(isNavActive('/blog', '/blog')).toBe(true);
    expect(isNavActive('/blog/my-first-post', '/blog')).toBe(true);

    expect(isNavActive('/publications', '/publications')).toBe(true);

    expect(isNavActive('/about', '/about')).toBe(true);
    expect(isNavActive('/about/team', '/about')).toBe(true);
  });

  it('handles null or empty pathname safely', () => {
    expect(isNavActive(null, '/products')).toBe(false);
    expect(isNavActive('', '/products')).toBe(false);
  });
});
