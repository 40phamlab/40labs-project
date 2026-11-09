import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useContextMenuStore, ContextMenuTargetType } from '../../stores/useContextMenuStore';
import { ContextMenu } from './ContextMenu';

interface ContextMenuProviderProps {
  children: React.ReactNode;
  onPinStepUp?: (actionId: string, callback: () => void) => void;
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = ({ children, onPinStepUp }) => {
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const closeMenu = useContextMenuStore((s) => s.closeMenu);
  const queryClient = useQueryClient();

  const handleRefreshData = React.useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Global contextmenu listener & shortcut interception
  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow native behavior inside input, textarea, or contenteditable
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable]');

      if (isEditable) {
        // Let editable fields show editable context menu (or native)
        e.preventDefault();
        openMenu({
          x: e.clientX,
          y: e.clientY,
          targetType: 'editable',
        });
        return;
      }

      e.preventDefault();
      closeMenu();

      // Check context data attributes
      let targetType: ContextMenuTargetType = 'global';
      let targetId: string | undefined = undefined;
      let meta: Record<string, unknown> | undefined = undefined;

      const ctxElement = target.closest('[data-ctx]') as HTMLElement | null;
      if (ctxElement) {
        const ctxType = ctxElement.getAttribute('data-ctx');
        targetId = ctxElement.getAttribute('data-ctx-id') || undefined;
        if (ctxType === 'chat') targetType = 'chat';
        if (ctxType === 'message') {
          targetType = 'message';
          meta = {
            messageBody: ctxElement.getAttribute('data-message-body') || ctxElement.innerText,
          };
        }
      } else {
        const selectedText = window.getSelection()?.toString();
        if (selectedText && selectedText.trim().length > 0) {
          targetType = 'text';
        }
      }

      openMenu({
        x: e.clientX,
        y: e.clientY,
        targetType,
        targetId,
        meta,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isDev = import.meta.env.DEV;

      // Block F12 in production
      if (e.key === 'F12' && !isDev) {
        e.preventDefault();
      }

      // Block Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U / Ctrl+P / Ctrl+S
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && ['i', 'j', 'I', 'J'].includes(e.key))) {
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && ['u', 'U', 'p', 'P', 's', 'S'].includes(e.key)) {
        e.preventDefault();
      }

      // Remap Ctrl+R or F5 to invalidate queries (refresh data without webview reload)
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        handleRefreshData();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [openMenu, closeMenu, handleRefreshData]);

  return (
    <>
      {children}
      <ContextMenu onRefreshData={handleRefreshData} onPinStepUp={onPinStepUp} />
    </>
  );
};
