import * as React from 'react';
import { useLandingMotion } from '../hooks/useLandingMotion';
import { buildGrid, pathOf, litCells } from '../lib/hexGrid';
import { useThemeStore } from '../../../stores/useThemeStore';
import '../landing.css';

const getHasPlayed = () => {
  if (typeof window === 'undefined') return true;
  try {
    const val = sessionStorage.getItem('40labs_landing_choreography_played');
    if (!val) {
      sessionStorage.setItem('40labs_landing_choreography_played', 'true');
      return false;
    }
    return true;
  } catch {
    return true;
  }
};

export const LandingBackdrop: React.FC = () => {
  const { paused } = useLandingMotion();
  const { theme } = useThemeStore();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 1200, height: 800 });
  const [sSize, setSSize] = React.useState(32);
  const [animateChoreography, setAnimateChoreography] = React.useState(false);

  React.useEffect(() => {
    const played = getHasPlayed();
    if (!played && !paused) {
      setAnimateChoreography(true);
    }
  }, [paused]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });
      const computedS = Math.max(26, Math.min(42, w / 50));
      setSSize(Math.round(computedS));
    };

    updateSize();

    let timeoutId: number;
    const handleResize = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(updateSize, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const gridCells = React.useMemo(() => {
    return buildGrid(dimensions.width, dimensions.height, sSize, 3);
  }, [dimensions.width, dimensions.height, sSize]);

  const outlinePath = React.useMemo(() => {
    return pathOf(gridCells);
  }, [gridCells]);

  const litGroup = React.useMemo(() => {
    return litCells(gridCells, dimensions.width, dimensions.height, 42);
  }, [gridCells, dimensions.width, dimensions.height]);

  const resolvedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const isDark = resolvedTheme === 'dark';

  const greenOpacity = isDark ? 0.30 : 0.16;
  const orangeOpacity = isDark ? 0.22 : 0.14;
  const deepGreenOpacity = isDark ? 0.20 : 0.10;

  const strokeColor = isDark
    ? 'color-mix(in srgb, var(--foreground) 7%, transparent)'
    : 'color-mix(in srgb, var(--foreground) 6%, transparent)';

  return (
    <div
      ref={containerRef}
      className={`landing-backdrop fixed inset-0 z-0 overflow-hidden pointer-events-none select-none ${
        paused ? 'motion-paused' : ''
      }`}
    >
      {/* C. Aurora Tied to Content */}
      <div className={`absolute inset-0 filter blur-[110px] ${animateChoreography ? 'animate-backdrop-fade' : ''}`}>
        <div
          className="aurora-orb-1 absolute top-1/3 left-1/4 w-[50vmax] h-[50vmax] rounded-full"
          style={{ backgroundColor: 'var(--color-green)', opacity: greenOpacity }}
        />
        <div
          className="aurora-orb-2 absolute bottom-10 right-10 w-[55vmax] h-[55vmax] rounded-full"
          style={{ backgroundColor: 'var(--color-orange)', opacity: orangeOpacity }}
        />
        <div
          className="aurora-orb-1 absolute top-10 right-1/4 w-[45vmax] h-[45vmax] rounded-full"
          style={{ backgroundColor: 'var(--color-deep-green)', opacity: deepGreenOpacity }}
        />
      </div>

      {/* B.4 Header-safe Fade & Edge-fade Masks Wrapper */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 200px, black 320px, black 100%), radial-gradient(ellipse 65% 60% at 50% 50%, transparent 0%, transparent 35%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, transparent 200px, black 320px, black 100%), radial-gradient(ellipse 65% 60% at 50% 50%, transparent 0%, transparent 35%, black 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      >
        {/* B.3a Outline Layer */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={outlinePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* B.3b Lit Layer */}
        <div className="absolute inset-0">
          {litGroup.map((cell, idx) => {
            const delay = Math.min(600, idx * 12);
            const stableOpacity = 0.45 + ((Math.abs(cell.q * 37 + cell.r * 19) % 55) / 100);
            const lightMult = isDark ? 1.0 : 0.9;

            return (
              <div
                key={`${cell.q}-${cell.r}`}
                className={`absolute bg-[#F97316] hex-clip ${animateChoreography ? 'animate-item-rise' : ''}`}
                style={{
                  left: `${cell.cx - sSize}px`,
                  top: `${cell.cy - sSize}px`,
                  width: `${sSize * 2}px`,
                  height: `${sSize * 2}px`,
                  opacity: animateChoreography ? 0 : stableOpacity * lightMult,
                  animationDelay: animateChoreography ? `${delay}ms` : '0ms',
                  animationFillMode: 'forwards',
                }}
              />
            );
          })}
        </div>

        {/* B.3c Pointer Glow */}
        <div
          className="pointer-glow"
          style={{
            maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${dimensions.width}' height='${dimensions.height}' viewBox='0 0 ${dimensions.width} ${dimensions.height}'%3E%3Cpath d='${outlinePath}' fill='none' stroke='%23000' stroke-width='1.5' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E")`,
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${dimensions.width}' height='${dimensions.height}' viewBox='0 0 ${dimensions.width} ${dimensions.height}'%3E%3Cpath d='${outlinePath}' fill='none' stroke='%23000' stroke-width='1.5' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E")`,
            maskSize: `${dimensions.width}px ${dimensions.height}px`,
            WebkitMaskSize: `${dimensions.width}px ${dimensions.height}px`,
          }}
        />
      </div>
    </div>
  );
};
