import { describe, it, expect } from 'vitest';
import { generateHoneycombCluster } from './hexGrid';

describe('hexGrid helper', () => {
  it('generates cells with correct properties and stable values', () => {
    const cluster = generateHoneycombCluster('bottom-left', 2, 3, 123);
    expect(cluster.length).toBe(6);
    expect(cluster[0]).toHaveProperty('id');
    expect(cluster[0]).toHaveProperty('q');
    expect(cluster[0]).toHaveProperty('r');
    expect(cluster[0].opacity).toBeGreaterThanOrEqual(0.55);
    expect(cluster[0].opacity).toBeLessThanOrEqual(1.0);
    expect(typeof cluster[0].isLit).toBe('boolean');
  });

  it('includes lit cells for animation', () => {
    const cluster = generateHoneycombCluster('bottom-right', 3, 4, 42);
    const litCells = cluster.filter((c) => c.isLit);
    expect(litCells.length).toBeGreaterThan(0);
  });
});
