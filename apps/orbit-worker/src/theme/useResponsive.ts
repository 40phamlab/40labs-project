// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'compact' | 'medium' | 'expanded';

export function useResponsive() {
  const { width } = useWindowDimensions();

  let bp: Breakpoint = 'compact';
  if (width >= 840) {
    bp = 'expanded';
  } else if (width >= 600) {
    bp = 'medium';
  }

  const isCompact = bp === 'compact';
  const contentMaxWidth = bp === 'expanded' ? 1200 : bp === 'medium' ? 768 : width;
  const columns = bp === 'expanded' ? 3 : bp === 'medium' ? 2 : 1;

  return {
    width,
    bp,
    isCompact,
    contentMaxWidth,
    columns,
  };
}
