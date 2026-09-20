import * as React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

/**
 * TitleBar
 *
 * A custom window title bar for undecorated Tauri windows.
 * Provides minimize, maximize, and close controls.
 */
export const TitleBar: React.FC = () => {
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <div
      className="h-10 flex items-center select-none z-[110]"
      data-tauri-drag-region
    >
      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="w-12 h-full flex items-center justify-center text-text-muted hover:bg-panel transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-full flex items-center justify-center text-text-muted hover:bg-panel transition-colors"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-12 h-full flex items-center justify-center text-text-muted hover:bg-[#EF4444] hover:text-white transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
