import * as React from 'react';
import { Minus, Square, X } from 'lucide-react';

/**
 * TitleBar
 *
 * Custom window title bar for undecorated Tauri desktop window.
 * Matches solid top chrome height and design token styling.
 */
export const TitleBar: React.FC = () => {
  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn('TitleBar minimize not supported in this environment', err);
    }
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.warn('TitleBar toggleMaximize not supported in this environment', err);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (err) {
      console.warn('TitleBar close not supported in this environment', err);
    }
  };

  return (
    <div
      className="h-10 flex items-center select-none shrink-0 z-[110] no-drag"
      data-tauri-drag-region
    >
      <div className="flex h-full items-center">
        <button
          type="button"
          onClick={handleMinimize}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer"
          title="Minimize"
          aria-label="Minimize Window"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer"
          title="Maximize"
          aria-label="Maximize Window"
        >
          <Square size={12} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-white hover:bg-danger transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer"
          title="Close"
          aria-label="Close Window"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
