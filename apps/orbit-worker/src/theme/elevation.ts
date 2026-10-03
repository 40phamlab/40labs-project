// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import { StyleSheet } from 'react-native';

export const elevationStyles = StyleSheet.create({
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  inset: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 0,
  },
});
