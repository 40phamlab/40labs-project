import * as React from 'react';
import { useLandingMotion } from '../hooks/useLandingMotion';
import { generateHoneycombCluster } from '../lib/hexGrid';
import { HexPhoto } from './HexPhoto';
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
  const [pointerOffset, setPointerOffset] = React.useState({ x: 0, y: 0 });
  const [animateChoreography, setAnimateChoreography] = React.useState(false);

  React.useEffect(() => {
    const played = getHasPlayed();
    if (!played && !paused) {
      setAnimateChoreography(true);
    }
  }, [paused]);

  const resolvedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const isDark = resolvedTheme === 'dark';

  const blCluster = React.useMemo(() => generateHoneycombCluster('bottom-left', 4, 4, 11), []);
  const brCluster = React.useMemo(() => generateHoneycombCluster('bottom-right', 5, 4, 22), []);

  React.useEffect(() => {
    if (paused) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      containerRef.current.style.setProperty('--mx', `${x}px`);
      containerRef.current.style.setProperty('--my', `${y}px`);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      targetX = (e.clientX - centerX) / 30;
      targetY = (e.clientY - centerY) / 30;
    };

    const updateLoop = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      setPointerOffset({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(updateLoop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [paused]);

  const greenOpacity = isDark ? 0.45 : 0.28;
  const orangeOpacity = isDark ? 0.30 : 0.20;
  const deepGreenOpacity = isDark ? 0.35 : 0.18;
  const clusterOpacityMultiplier = isDark ? 1.0 : 0.9;

  return (
    <div
      ref={containerRef}
      className={`landing-backdrop fixed inset-0 z-0 overflow-hidden pointer-events-none select-none ${
        paused ? 'motion-paused' : ''
      }`}
      style={
        {
          '--mx': '50%',
          '--my': '50%',
        } as React.CSSProperties
      }
    >
      {/* 1. Aurora Mesh */}
      <div className={`absolute inset-0 filter blur-[100px] ${animateChoreography ? 'animate-backdrop-fade' : ''}`}>
        <div
          className="aurora-orb-1 absolute -top-10 -left-10 w-[55vmax] h-[55vmax] rounded-full"
          style={{ backgroundColor: 'var(--color-green)', opacity: greenOpacity }}
        />
        <div
          className="aurora-orb-2 absolute top-1/4 -right-10 w-[60vmax] h-[60vmax] rounded-full"
          style={{ backgroundColor: 'var(--color-orange)', opacity: orangeOpacity }}
        />
        <div
          className="aurora-orb-1 absolute -bottom-20 left-1/3 w-[50vmax] h-[50vmax] rounded-full"
          style={{ backgroundColor: 'var(--color-deep-green)', opacity: deepGreenOpacity }}
        />
        <div
          className="aurora-orb-2 absolute bottom-1/4 right-1/4 w-[45vmax] h-[45vmax] rounded-full"
          style={{ backgroundColor: 'var(--color-green)', opacity: greenOpacity * 0.8 }}
        />
      </div>

      {/* Subtle Noise / Grain Overlay (3% opacity) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 2. Lattice Outlines with Radial Mask */}
      <div className={`absolute inset-0 lattice-mask ${isDark ? 'opacity-[0.09]' : 'opacity-[0.07]'} ${animateChoreography ? 'animate-backdrop-fade' : ''}`}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexPattern" width="40" height="46.188" patternUnits="userSpaceOnUse">
              <path
                d="M20 0 L40 11.547 L40 34.641 L20 46.188 L0 34.641 L0 11.547 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexPattern)" />
        </svg>
      </div>

      {/* 3. Filled Honeycomb Clusters with 12ms staggered delay by distance (cap 700ms) */}
      <div
        className="absolute bottom-6 left-6 grid gap-1 z-1"
        style={{ opacity: clusterOpacityMultiplier }}
      >
        {blCluster.map((cell, idx) => {
          const delay = Math.min(700, idx * 12);
          return (
            <div
              key={cell.id}
              className={`w-9 h-10 bg-[#F97316] hex-clip ${cell.isLit && !paused ? 'hex-pulse' : ''} ${animateChoreography ? 'animate-item-rise' : ''}`}
              style={{
                position: 'absolute',
                left: `${cell.x}px`,
                bottom: `${cell.y}px`,
                opacity: animateChoreography ? 0 : cell.opacity * 0.85,
                animationDelay: animateChoreography ? `${delay}ms` : `${cell.pulseDelay}s`,
                animationFillMode: 'forwards',
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute bottom-6 right-6 grid gap-1 z-1"
        style={{ opacity: clusterOpacityMultiplier }}
      >
        {brCluster.map((cell, idx) => {
          const delay = Math.min(700, idx * 12);
          return (
            <div
              key={cell.id}
              className={`w-9 h-10 bg-[#F97316] hex-clip ${cell.isLit && !paused ? 'hex-pulse' : ''} ${animateChoreography ? 'animate-item-rise' : ''}`}
              style={{
                position: 'absolute',
                right: `${cell.x}px`,
                bottom: `${cell.y}px`,
                opacity: animateChoreography ? 0 : cell.opacity * 0.85,
                animationDelay: animateChoreography ? `${delay}ms` : `${cell.pulseDelay}s`,
                animationFillMode: 'forwards',
              }}
            />
          );
        })}
      </div>

      {/* 4. Pointer Glow */}
      <div className="pointer-glow" />

      {/* 5. Floating Dots */}
      <div className={`absolute top-20 right-1/3 w-[28px] h-[28px] rounded-full bg-primary/40 floating-dot ${paused ? 'paused' : ''}`} style={{ animationDuration: '12s' }} />
      <div className={`absolute top-12 left-16 w-[14px] h-[14px] rounded-full bg-primary/50 floating-dot-delayed ${paused ? 'paused' : ''}`} style={{ animationDuration: '9s' }} />
      <div className={`absolute bottom-1/3 left-1/4 w-[8px] h-[8px] rounded-full bg-primary/60 floating-dot ${paused ? 'paused' : ''}`} style={{ animationDuration: '15s' }} />
      <div className={`absolute top-1/3 right-16 w-[24px] h-[24px] rounded-full bg-amber-500/40 floating-dot-delayed ${paused ? 'paused' : ''}`} style={{ animationDuration: '14s' }} />
      <div className={`absolute bottom-24 right-1/3 w-[18px] h-[18px] rounded-full bg-amber-500/50 floating-dot ${paused ? 'paused' : ''}`} style={{ animationDuration: '16s' }} />

      {/* 6. HexPhotos with delay-photos */}
      <div className={animateChoreography ? 'animate-item-rise delay-photos' : ''} style={{ animationFillMode: 'forwards', opacity: animateChoreography ? 0 : 1 }}>
        <HexPhoto
          src="/media/picture/labtubes.png"
          size="large"
          className="top-24 left-16 hidden xl:block w-[220px] h-[220px]"
          parallaxOffset={pointerOffset}
          depth={0.8}
        />
        <HexPhoto
          src="/media/picture/medPills.png"
          size="medium"
          className="top-36 right-20 hidden xl:block w-[150px] h-[150px]"
          parallaxOffset={pointerOffset}
          depth={1.2}
        />
        <HexPhoto
          src="/media/picture/pharmastock.png"
          size="small"
          className="bottom-32 left-28 hidden xl:block w-[100px] h-[100px]"
          parallaxOffset={pointerOffset}
          depth={0.5}
        />
      </div>
    </div>
  );
};
