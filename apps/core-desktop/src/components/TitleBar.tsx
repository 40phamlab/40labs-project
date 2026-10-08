import * as React from 'react';
import { PanelLeft, Minus, Square, X } from 'lucide-react';
import { useAppShell } from '@40labs/ui-components';
import { HamburgerMenu } from './HamburgerMenu';
import { BranchControl } from './BranchControl';
import { ConnectivityIndicator } from './ConnectivityIndicator';

export interface TitleBarProps {
  brandName?: string;
  onHelpClick?: () => void;
  onUpdateClick?: () => void;
  onSettingsClick?: () => void;
  onToggleSidebar?: () => void;
  hasUpdateAvailable?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  brandName = '40Labs',
  onHelpClick,
  onUpdateClick,
  onSettingsClick,
  onToggleSidebar,
  hasUpdateAvailable = false,
}) => {
  const shell = useAppShell();
  const isNavClosed = shell.navState === 'closed';

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      shell.toggleSidebar();
    }
  };

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
      className="h-10 w-full flex items-center justify-between px-2 bg-app-bg select-none shrink-0 z-[110]"
    >
      {/* Left side: Sidebar Toggle, Logo, Hamburger, Branch */}
      <div className="flex items-center gap-1.5 h-full min-w-0 no-drag shrink-0" data-tauri-drag-region="false">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={handleToggle}
          className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer no-drag select-none"
          data-tauri-drag-region="false"
          title={isNavClosed ? 'Show sidebar navigation (Ctrl+B)' : 'Toggle sidebar navigation (Ctrl+B)'}
          aria-label={isNavClosed ? 'Show sidebar navigation' : 'Toggle sidebar navigation'}
        >
          <PanelLeft size={15} className={isNavClosed ? 'text-action-primary' : 'text-current'} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 px-2 no-drag" data-tauri-drag-region="false">
          <div className="w-4 h-4 bg-accent rounded flex items-center justify-center text-[9px] font-bold text-text-inverse">
            40
          </div>
          <span className="font-heading font-bold text-xs tracking-tight text-text-primary">
            {brandName}
          </span>
        </div>

        {/* Hamburger Menu */}
        <HamburgerMenu
          onHelpClick={onHelpClick}
          onUpdateClick={onUpdateClick}
          onSettingsClick={onSettingsClick}
          hasUpdateAvailable={hasUpdateAvailable}
        />

        {/* Branch Control */}
        <BranchControl />
      </div>

      {/* Center / Empty Drag Spacer */}
      <div
        className="flex-1 h-full drag-region"
        data-tauri-drag-region
      />

      {/* Right side: Status slot + Window controls */}
      <div className="flex items-center gap-2 no-drag shrink-0 h-full" data-tauri-drag-region="false">
        {/* Status slot for Step 4 */}
        <div data-testid="status-indicator-slot" className="flex items-center px-2">
          <ConnectivityIndicator />
        </div>

        {/* Window Controls */}
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
    </div>
  );
};
