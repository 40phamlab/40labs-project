import * as React from 'react';

export type SidebarState = 'open' | 'mini' | 'closed';

const STORAGE_PREFIX = '40labs_sidebar_state_';

export function useSidebarState(key: string) {
  const storageKey = STORAGE_PREFIX + key;

  const [state, setStateValue] = React.useState<SidebarState>(() => {
    if (typeof window === 'undefined') return 'open';
    const saved = localStorage.getItem(storageKey);
    if (saved === 'open' || saved === 'mini' || saved === 'closed') {
      return saved;
    }
    return 'open';
  });

  const setState = React.useCallback(
    (newState: SidebarState) => {
      setStateValue(newState);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newState);
      }
    },
    [storageKey]
  );

  const cycleState = React.useCallback(() => {
    setStateValue((current: SidebarState) => {
      if (current === 'open') return 'mini';
      if (current === 'mini') return 'closed';
      return 'open';
    });
  }, []);

  const isOpen = state === 'open';
  const isMini = state === 'mini';
  const isClosed = state === 'closed';

  return {
    state,
    setState,
    cycleState,
    isOpen,
    isMini,
    isClosed,
  };
}
