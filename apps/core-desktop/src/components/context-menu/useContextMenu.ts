import { useContextMenuStore } from '../../stores/useContextMenuStore';

export function useContextMenu() {
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const closeMenu = useContextMenuStore((s) => s.closeMenu);
  const isOpen = useContextMenuStore((s) => s.isOpen);

  return {
    openMenu,
    closeMenu,
    isOpen,
  };
}
