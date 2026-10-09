import * as React from 'react';
import { Minus, Square, X } from 'lucide-react';

export interface PublicTitleBarProps {
  brandName?: string;
}

export const PublicTitleBar: React.FC<PublicTitleBarProps> = ({ brandName = '40Labs' }) => {
  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn('PublicTitleBar minimize not supported in this environment', err);
    }
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.warn('PublicTitleBar toggleMaximize not supported in this environment', err);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (err) {
      console.warn('PublicTitleBar close not supported in this environment', err);
    }
  };

  return (
    <div
      className="h-10 w-full flex items-center justify-between px-2 bg-app-bg select-none shrink-0 z-[110]"
      data-tauri-drag-region
    >
      {/* Left side: Logo & Brand */}
      <div className="flex items-center gap-2 px-2 no-drag" data-tauri-drag-region="false">
        <div className="w-4 h-4 bg-accent rounded flex items-center justify-center text-[9px] font-bold text-text-inverse">
          40
        </div>
        <span className="font-heading font-bold text-xs tracking-tight text-text-primary">
          {brandName}
        </span>
      </div>

      {/* Center / Empty Drag Spacer */}
      <div
        className="flex-1 h-full drag-region"
        data-tauri-drag-region
      />

      {/* Right side: Window Controls */}
      <div className="flex h-full items-center no-drag" data-tauri-drag-region="false">
        <button
          type="button"
          onClick={handleMinimize}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer no-drag"
          data-tauri-drag-region="false"
          title="Minimize"
          aria-label="Minimize Window"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer no-drag"
          data-tauri-drag-region="false"
          title="Maximize"
          aria-label="Maximize Window"
        >
          <Square size={12} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-white hover:bg-danger transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer no-drag"
          data-tauri-drag-region="false"
          title="Close"
          aria-label="Close Window"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
