const SQRT3 = Math.sqrt(3);

export interface HexCell {
  q: number;
  r: number;
  cx: number;
  cy: number;
  points: string;
}

export function cellCenter(q: number, r: number, s: number) {
  return { x: s * SQRT3 * (q + r / 2), y: s * 1.5 * r };
}

export function cellPoints(cx: number, cy: number, s: number, g: number) {
  const rd = s - g / SQRT3;                 // draw radius; gap = g between neighbors
  const pts: string[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (60 * k - 30);   // vertices at -30,30,90,150,210,270 => pointy-top
    pts.push(`${(cx + rd * Math.cos(a)).toFixed(2)},${(cy + rd * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

export function buildGrid(width: number, height: number, s: number, g = 3, margin = 2 * s): HexCell[] {
  const cells: HexCell[] = [];
  const rMin = Math.floor(-margin / (1.5 * s));
  const rMax = Math.ceil((height + margin) / (1.5 * s));

  for (let r = rMin; r <= rMax; r++) {
    const qMin = Math.floor((-margin) / (s * SQRT3) - r / 2);
    const qMax = Math.ceil((width + margin) / (s * SQRT3) - r / 2);
    for (let q = qMin; q <= qMax; q++) {
      const { x: cx, y: cy } = cellCenter(q, r, s);
      const points = cellPoints(cx, cy, s, g);
      cells.push({
        q,
        r,
        cx: Number(cx.toFixed(2)),
        cy: Number(cy.toFixed(2)),
        points,
      });
    }
  }
  return cells;
}

export function outlinePath(cells: HexCell[]): string {
  return cells.map(cell => {
    const coords = cell.points.split(' ');
    if (coords.length < 6) return '';
    return `M ${coords.join(' L ')} Z`;
  }).join(' ');
}

export function pathOf(cells: HexCell[]): string {
  return outlinePath(cells);
}

export function litCells(cells: HexCell[], width: number, height: number, seed = 42): HexCell[] {
  let s = seed;
  const random = (q: number, r: number) => {
    let val = Math.sin(q * 12.9898 + r * 78.233 + s) * 43758.5453123;
    return val - Math.floor(val);
  };

  const R = Math.max(300, 0.24 * width);
  const blX = 0;
  const blY = height;
  const brX = width;
  const brY = height;

  const result: HexCell[] = [];
  const carouselRight = Math.min(760, width * 0.45 + 150);

  for (const cell of cells) {
    if (cell.cy < 200) {
      continue; // header band top 200px
    }

    if (cell.cx >= -28 && cell.cx <= carouselRight + 28 && cell.cy >= 72 && cell.cy <= height - 72) {
      continue; // carousel card + dots + 28px expansion
    }

    const dBL = Math.hypot(cell.cx - blX, cell.cy - blY);
    const dBR = Math.hypot(cell.cx - brX, cell.cy - brY);

    const pBL = Math.pow(Math.max(0, 1 - dBL / R), 1.4);
    const pBR = Math.pow(Math.max(0, 1 - dBR / R), 1.4);

    const p = Math.max(pBL, pBR);
    if (p <= 0) continue;

    const rand = random(cell.q, cell.r);
    if (rand < p) {
      result.push(cell);
    }
  }

  return result;
}
