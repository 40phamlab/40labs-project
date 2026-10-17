import { useState, useEffect } from 'react';

export function useLandingMotion() {
  const [paused, setPaused] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isHidden = document.hidden;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return isHidden || reducedMotion;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateMotion = () => {
      const isHidden = document.hidden;
      const reducedMotion = mediaQuery.matches;
      setPaused(isHidden || reducedMotion);
    };

    document.addEventListener('visibilitychange', updateMotion);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMotion);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(updateMotion);
    }

    updateMotion();

    return () => {
      document.removeEventListener('visibilitychange', updateMotion);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMotion);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(updateMotion);
      }
    };
  }, []);

  return { paused };
}
