import * as React from 'react';

/**
 * STANDARD LOADING TIMING RULES:
 * - instant = anything expected < 2s (route/screen data loading, auth status, lock transitions)
 * - long    = anything >= 2s (sync, backup, export, import, report generation, first boot)
 * - transition = 150ms enter fade/slide animation
 */
export const LOADING_TIMING = {
  /** Maximum expected time for instant loader (2,000ms) */
  INSTANT_THRESHOLD_MS: 2000,
  /** Minimum expected time threshold for long loader (2,000ms) */
  LONG_THRESHOLD_MS: 2000,
  /** Standard screen enter transition duration (150ms) */
  TRANSITION_DURATION_MS: 150,
  /** Minimum display duration to prevent visual UI flicker on fast responses (200ms) */
  MIN_DISPLAY_TIME_MS: 200,
} as const;

/**
 * Returns the recommended loader variant based on estimated task duration in milliseconds.
 */
export function getRecommendedLoaderVariant(estimatedDurationMs: number): 'instant' | 'long' {
  return estimatedDurationMs >= LOADING_TIMING.LONG_THRESHOLD_MS ? 'long' : 'instant';
}

/**
 * Custom React hook to prevent loader flicker on fast API/cache responses by enforcing
 * a minimum display duration.
 */
export function useMinDisplayTime(
  isLoading: boolean,
  minDisplayMs = LOADING_TIMING.MIN_DISPLAY_TIME_MS
): boolean {
  const [shouldDisplay, setShouldDisplay] = React.useState(isLoading);
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShouldDisplay(true);
    } else if (startTimeRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = minDisplayMs - elapsed;
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShouldDisplay(false);
          startTimeRef.current = null;
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShouldDisplay(false);
        startTimeRef.current = null;
      }
    } else {
      setShouldDisplay(false);
    }
  }, [isLoading, minDisplayMs]);

  return shouldDisplay;
}

export interface LoaderAnimationProps {
  variant: 'instant' | 'long';
  size?: number;
  label?: string;
}

const InstantSvg: React.FC<{ size?: number }> = React.memo(({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="40 30 475 485"
    role="img"
    aria-label="Loading"
    shapeRendering="geometricPrecision"
    style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
    className={!size ? 'w-8 h-8' : undefined}
  >
    <style>{`
      .h {
        transform-box: fill-box; transform-origin: center;
        opacity: 0;
        animation: coreInstantAssemble 2.8s infinite;
      }
      .t { --x: 0px; --y: -38px; animation-delay: 0s; }
      .l { --x: -34px; --y: -8px; animation-delay: 0.12s; }
      .r { --x: 34px; --y: -8px; animation-delay: 0.24s; }
      .b { --x: 0px; --y: 38px; animation-delay: 0.36s; }
      @keyframes coreInstantAssemble {
        0%   { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.82); animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
        28%  { opacity: 1; transform: translate(0, 0) scale(1); }
        74%  { opacity: 1; transform: translate(0, 0) scale(1); animation-timing-function: cubic-bezier(0.55, 0, 0.8, 0.4); }
        92%  { opacity: 0; transform: translate(calc(var(--x) * -0.35), calc(var(--y) * -0.35)) scale(0.94); }
        100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.82); }
      }
      .pulse {
        transform-box: fill-box; transform-origin: center;
        animation: coreInstantPulse 2.8s infinite;
      }
      @keyframes coreInstantPulse {
        0%, 38% { transform: scale(1); filter: none; }
        50% { transform: scale(1.07); filter: drop-shadow(0 0 14px rgba(247, 148, 29, 0.75)); }
        62%, 100% { transform: scale(1); filter: none; }
      }
      .ring {
        fill: none; stroke: #FFFFFF; stroke-width: 3; stroke-linecap: round;
        stroke-dasharray: 90 1710; opacity: 0;
        animation: coreInstantOrbit 2.8s linear infinite;
      }
      @keyframes coreInstantOrbit {
        0%, 30% { stroke-dashoffset: 0; opacity: 0; }
        36% { opacity: 0.9; }
        70% { opacity: 0.9; }
        76%, 100% { stroke-dashoffset: -1800; opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .h, .pulse, .ring { animation: none !important; }
        .h { opacity: 1 !important; }
        .ring { display: none !important; }
      }
    `}</style>
    <circle className="ring" cx="277" cy="277" r="228" pathLength="1800" transform="rotate(-90 277 277)" />
    <g stroke="#FFFFFF" strokeWidth="10" strokeLinejoin="miter">
      <polygon className="h t" fill="#006837" points="280,82 365,130 365,175 280,222 195,175 195,130" />
      <polygon className="h l" fill="#006837" points="177,190 265,240 265,262 170,315 170,380 92,335 92,232" />
      <g className="pulse">
        <polygon className="h r" fill="#F7941D" points="380,190 462,238 462,335 382,380 382,318 293,265 293,236" />
      </g>
      <polygon className="h b" fill="#006837" points="277,284 366,334 366,420 277,470 190,420 190,334" />
    </g>
  </svg>
));

const LongSvg: React.FC<{ size?: number }> = React.memo(({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="70 60 415 435"
    role="img"
    aria-label="Loading"
    style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
    className={!size ? 'w-8 h-8' : undefined}
  >
    <style>{`
      .h { transform-box: fill-box; transform-origin: center; opacity: 0.15; animation: coreLongSeq 1.6s ease-in-out infinite; }
      .a { animation-delay: 0s; }
      .b { animation-delay: 0.2s; }
      .c { animation-delay: 0.4s; }
      .d { animation-delay: 0.6s; }
      .o { animation-name: coreLongSeqo; }
      @keyframes coreLongSeq {
        0%, 100% { opacity: 0.15; transform: scale(0.88); }
        25%, 45% { opacity: 1; transform: scale(1); }
        70% { opacity: 0.15; transform: scale(0.88); }
      }
      @keyframes coreLongSeqo {
        0%, 100% { opacity: 0.25; transform: scale(0.88); }
        25%, 45% { opacity: 1; transform: scale(1.08); }
        70% { opacity: 0.25; transform: scale(0.88); }
      }
      @media (prefers-reduced-motion: reduce) {
        .h { animation: none !important; opacity: 1 !important; }
      }
    `}</style>
    <g stroke="#FFFFFF" strokeWidth="10" strokeLinejoin="miter">
      <polygon className="h a" fill="#006837" points="280,82 365,130 365,175 280,222 195,175 195,130" />
      <polygon className="h b o" fill="#F7941D" points="380,190 462,238 462,335 382,380 382,318 293,265 293,236" />
      <polygon className="h c" fill="#006837" points="277,284 366,334 366,420 277,470 190,420 190,334" />
      <polygon className="h d" fill="#006837" points="177,190 265,240 265,262 170,315 170,380 92,335 92,232" />
    </g>
  </svg>
));

export function LoaderAnimation({ variant, size, label }: LoaderAnimationProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex flex-col items-center justify-center gap-2 transition-opacity duration-150 ease-in-out opacity-100"
    >
      {variant === 'long' ? <LongSvg size={size} /> : <InstantSvg size={size} />}
      {label && (
        <span className="font-sora text-text-muted text-xs">
          {label}
        </span>
      )}
    </div>
  );
}
