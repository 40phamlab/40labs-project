// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import { useTheme } from './ThemeProvider';

export type ElevationType = 'raised' | 'pressed' | 'inset';

export function useElevation(type: ElevationType) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  switch (type) {
    case 'raised':
      return {
        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.15)',
        elevation: 4,
      };
    case 'pressed':
      return {
        boxShadow: isDark ? 'inset 0 2px 4px rgba(0, 0, 0, 0.7)' : 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
        elevation: 1,
      };
    case 'inset':
      return {
        boxShadow: isDark ? 'inset 0 1px 3px rgba(0, 0, 0, 0.6)' : 'inset 0 1px 3px rgba(0, 0, 0, 0.15)',
        elevation: 0,
      };
    default:
      return {};
  }
}
