import * as React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

/**
 * TitleBar
 *
 * Custom window title bar for undecorated Tauri desktop window.
 * Matches solid top chrome height and design token styling.
 */
export const TitleBar: React.FC = () => {
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <div
      className="h-10 flex items-center select-none shrink-0 z-[110]"
      data-tauri-drag-region
    >
      <div className="flex h-full items-center">
        <button
          type="button"
          onClick={handleMinimize}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          title="Minimize"
          aria-label="Minimize Window"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          title="Maximize"
          aria-label="Maximize Window"
        >
          <Square size={12} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-white hover:bg-danger transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          title="Close"
          aria-label="Close Window"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
