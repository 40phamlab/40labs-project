export interface HexCell {
  id: string;
  q: number;
  r: number;
  x: number;
  y: number;
  opacity: number;
  isLit: boolean;
  pulseDelay: number;
}

export function generateHoneycombCluster(
  anchor: 'bottom-left' | 'bottom-right',
  rows = 3,
  cols = 5,
  seed = 42
): HexCell[] {
  const cells: HexCell[] = [];
  let index = 0;

  let s = seed;
  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const hexWidth = 40;
  const hexHeight = 35;

  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const x = q * hexWidth + (r % 2) * (hexWidth / 2);
      const y = r * (hexHeight * 0.75);

      const randVal = random();
      const opacity = 0.55 + randVal * 0.45;
      const isLit = index % 7 === 2 || index % 11 === 4;
      const pulseDelay = random() * 4;

      cells.push({
        id: `${anchor}-${q}-${r}`,
        q,
        r,
        x,
        y,
        opacity: Number(opacity.toFixed(2)),
        isLit,
        pulseDelay: Number(pulseDelay.toFixed(1)),
      });
      index++;
    }
  }

  return cells;
}
