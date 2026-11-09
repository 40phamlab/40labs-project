import * as React from 'react';
import { createPortal } from 'react-dom';
import { useContextMenuStore } from '../../stores/useContextMenuStore';
import { resolveMenuItems, ContextMenuItem } from './menuItems';

interface ContextMenuProps {
  onRefreshData?: () => void;
  onPinStepUp?: (actionId: string, callback: () => void) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ onRefreshData, onPinStepUp }) => {
  const { isOpen, x, y, targetType, targetId, meta, closeMenu } = useContextMenuStore();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

  const selectedText = typeof window !== 'undefined' ? window.getSelection()?.toString() : '';
  const resolvedTargetType = targetType === 'global' && selectedText ? 'text' : targetType;

  const items = React.useMemo(() => {
    return resolveMenuItems({
      targetType: resolvedTargetType,
      targetId,
      selectedText,
      meta,
      onRefreshData,
      onPinStepUp,
    });
  }, [resolvedTargetType, targetId, selectedText, meta, onRefreshData, onPinStepUp]);

  // Viewport clamping & position calculation
  const [coords, setCoords] = React.useState({ left: x, top: y });

  React.useEffect(() => {
    if (!isOpen) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const rect = menuEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x;
    let top = y;

    if (left + rect.width > vw - 10) {
      left = vw - rect.width - 10;
    }
    if (top + rect.height > vh - 10) {
      top = vh - rect.height - 10;
    }
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    setCoords({ left, top });
    setSelectedIndex(0);
  }, [isOpen, x, y, items.length]);

  // Outside click, Escape, scroll, blur handlers
  React.useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.filter((i) => !i.disabled).length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const activeItems = items.filter((i) => !i.disabled);
        setSelectedIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItems = items.filter((i) => !i.disabled);
        const targetItem = activeItems[selectedIndex];
        if (targetItem) {
          targetItem.onSelect();
          closeMenu();
        }
      }
    };

    const handleScrollOrBlur = () => {
      closeMenu();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleScrollOrBlur);
    window.addEventListener('scroll', handleScrollOrBlur, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleScrollOrBlur);
      window.removeEventListener('scroll', handleScrollOrBlur, true);
    };
  }, [isOpen, items, selectedIndex, closeMenu]);

  if (!isOpen) return null;

  const activeItems = items.filter((i) => !i.disabled);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ left: coords.left, top: coords.top }}
      className="fixed z-[9999] min-w-[220px] bg-surface border border-border rounded-[12px] shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-120 font-sans"
    >
      {items.map((item) => {
        const activeIdx = activeItems.indexOf(item);
        const isSelected = activeIdx === selectedIndex && !item.disabled;

        return (
          <React.Fragment key={item.id}>
            <button
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                closeMenu();
              }}
              onMouseEnter={() => {
                if (!item.disabled && activeIdx !== -1) {
                  setSelectedIndex(activeIdx);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-[8px] transition-colors ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed text-text-muted'
                  : item.danger
                  ? 'text-danger hover:bg-danger/10'
                  : isSelected
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text hover:bg-surface-elevated'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon && <span className="text-text-muted">{item.icon}</span>}
                <span>{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-[10px] text-text-muted font-mono">{item.shortcut}</span>
              )}
            </button>
            {item.dividerAfter && <div className="my-1 border-t border-border" />}
          </React.Fragment>
        );
      })}
    </div>,
    document.body
  );
};
