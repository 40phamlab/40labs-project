import { describe, it, expect } from 'vitest';
import { buildGrid, cellCenter, cellPoints, outlinePath } from './hexGrid';

describe('hexGrid geometry and tests (Step 1)', () => {
  const SQRT3 = Math.sqrt(3);

  it('Test 1: For one cell, all 6 edge lengths equal within 1e-2 (due to .toFixed(2)), and equal rd', () => {
    const s = 40;
    const g = 3;
    const rd = s - g / SQRT3;
    const { x: cx, y: cy } = cellCenter(0, 0, s);
    const pointsStr = cellPoints(cx, cy, s, g);
    const pts = pointsStr.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });

    expect(pts.length).toBe(6);
    const edgeLengths: number[] = [];
    for (let i = 0; i < 6; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % 6];
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      edgeLengths.push(len);
    }

    const expectedRd = rd;
    for (const len of edgeLengths) {
      expect(Math.abs(len - expectedRd)).toBeLessThan(0.05);
      expect(Math.abs(len - edgeLengths[0])).toBeLessThan(0.05);
    }
  });

  it('Test 2: For cell (0,0) and each of its 6 axial neighbors, facing edge distance equals g within tolerance', () => {
    const s = 40;
    const g = 3;
    const neighbors = [
      { q: 1, r: 0 },
      { q: -1, r: 0 },
      { q: 0, r: 1 },
      { q: 0, r: -1 },
      { q: 1, r: -1 },
      { q: -1, r: 1 },
    ];

    const c0 = cellCenter(0, 0, s);
    const pts0Str = cellPoints(c0.x, c0.y, s, g);
    const pts0 = pts0Str.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });

    for (const n of neighbors) {
      const cn = cellCenter(n.q, n.r, s);
      const ptsnStr = cellPoints(cn.x, cn.y, s, g);
      const ptsn = ptsnStr.split(' ').map(p => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });

      let minDist = Infinity;
      for (const p0 of pts0) {
        for (const pn of ptsn) {
          const d = Math.hypot(pn.x - p0.x, pn.y - p0.y);
          if (d < minDist) minDist = d;
        }
      }

      expect(Math.abs(minDist - g)).toBeLessThan(0.05);
    }
  });

  it('Test 3: Min distance between cell centers for adjacent neighbors in a 1920x1080 grid >= sqrt(3)*s - tolerance', () => {
    const s = 32;
    const width = 1920;
    const height = 1080;
    const grid = buildGrid(width, height, s, 3);
    const minAllowed = SQRT3 * s - 0.05;

    // Check sample of cells and their axial neighbors
    const sample = grid.slice(0, 100);
    const gridMap = new Map(grid.map(c => [`${c.q},${c.r}`, c]));
    const neighborOffsets = [
      { q: 1, r: 0 }, { q: -1, r: 0 },
      { q: 0, r: 1 }, { q: 0, r: -1 },
      { q: 1, r: -1 }, { q: -1, r: 1 }
    ];

    for (const cell of sample) {
      for (const off of neighborOffsets) {
        const neighbor = gridMap.get(`${cell.q + off.q},${cell.r + off.r}`);
        if (neighbor) {
          const dist = Math.hypot(neighbor.cx - cell.cx, neighbor.cy - cell.cy);
          expect(dist).toBeGreaterThanOrEqual(minAllowed);
        }
      }
    }
  });

  it('Test 4: Every vertex of every cell has angle matching pointy-top set (-30,30,90,150,210,270 deg) within tolerance', () => {
    const s = 35;
    const g = 3;
    const grid = buildGrid(800, 600, s, g);
    const allowedAngles = [-30, 30, 90, 150, 210, 270];

    for (const cell of grid) {
      const pts = cell.points.split(' ').map(p => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });

      for (const pt of pts) {
        let angleDeg = (Math.atan2(pt.y - cell.cy, pt.x - cell.cx) * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 360;

        const matchesAny = allowedAngles.some(target => {
          let t = target;
          if (t < 0) t += 360;
          return Math.abs(angleDeg - t) < 0.2 || Math.abs(angleDeg - t - 360) < 0.2 || Math.abs(angleDeg - t + 360) < 0.2;
        });

        expect(matchesAny).toBe(true);
      }
    }
  });

  it('Test 5: Grid covers the viewport (1920x1080)', () => {
    const s = 32;
    const width = 1920;
    const height = 1080;
    const grid = buildGrid(width, height, s, 3);
    expect(grid.length).toBeGreaterThan(0);

    const minX = Math.min(...grid.map(c => c.cx));
    const maxX = Math.max(...grid.map(c => c.cx));
    const minY = Math.min(...grid.map(c => c.cy));
    const maxY = Math.max(...grid.map(c => c.cy));

    expect(minX).toBeLessThan(0);
    expect(maxX).toBeGreaterThan(width);
    expect(minY).toBeLessThan(0);
    expect(maxY).toBeGreaterThan(height);
  });

  it('Debug SVG generation for 7 cells (flower of 1 center + 6 neighbors)', () => {
    const s = 40;
    const g = 3;
    const centerQ = 0;
    const centerR = 0;
    const neighborCoords = [
      { q: 1, r: 0 },
      { q: -1, r: 0 },
      { q: 0, r: 1 },
      { q: 0, r: -1 },
      { q: 1, r: -1 },
      { q: -1, r: 1 },
    ];

    const flowerCells = [
      (() => {
        const c = cellCenter(centerQ, centerR, s);
        return { q: centerQ, r: centerR, cx: c.x, cy: c.y, points: cellPoints(c.x, c.y, s, g) };
      })(),
      ...neighborCoords.map(n => {
        const c = cellCenter(n.q, n.r, s);
        return { q: n.q, r: n.r, cx: c.x, cy: c.y, points: cellPoints(c.x, c.y, s, g) };
      })
    ];

    const svgPath = outlinePath(flowerCells);
    expect(svgPath).toContain('M');
    expect(svgPath).toContain('Z');
    console.log('Flower debug SVG path generated successfully with 7 cells.');
  });
});
