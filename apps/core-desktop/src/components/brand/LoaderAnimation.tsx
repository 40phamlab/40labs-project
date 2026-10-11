/**
 * STANDARD LOADING TIMING RULES:
 * - instant = anything expected < 2s (route/screen data loading, auth status, lock transitions)
 * - long    = anything >= 2s (sync, backup, export, import, report generation, first boot)
 * - transition = 150ms enter fade/slide animation
 */
import { MEDIA } from '../../lib/media';

export const LOADING_TIMING = {
  /** Maximum expected time for instant loader (2,000ms) */
  INSTANT_THRESHOLD_MS: 2000,
  /** Minimum expected time threshold for long loader (2,000ms) */
  LONG_THRESHOLD_MS: 2000,
  /** Standard screen enter transition duration (150ms) */
  TRANSITION_DURATION_MS: 150,
  /** Minimum display duration to prevent visual UI flicker on fast responses (300ms) */
  MIN_DISPLAY_TIME_MS: 200,
} as const;

/**
 * Returns the recommended loader variant based on estimated task duration in milliseconds.
 */
export function getRecommendedLoaderVariant(estimatedDurationMs: number): 'instant' | 'long' {
  return estimatedDurationMs >= LOADING_TIMING.LONG_THRESHOLD_MS ? 'long' : 'instant';
}

export interface LoaderAnimationProps {
  variant: 'instant' | 'long';
  size?: number;
  label?: string;
}

export function LoaderAnimation({ variant, size, label }: LoaderAnimationProps) {
  const src = MEDIA.loader[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex flex-col items-center justify-center gap-2"
    >
      <img
        src={src}
        alt={label || 'Loading...'}
        draggable={false}
        style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
        className={!size ? 'w-8 h-8' : undefined}
      />
      {label && (
        <span className="font-sora text-text-muted text-xs">
          {label}
        </span>
      )}
    </div>
  );
}
