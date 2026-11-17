import * as React from 'react';
import { PanelLeft, Minus, Square, X } from 'lucide-react';
import { useAppShell, Dropdown } from '@40labs/ui-components';
import { HamburgerMenu } from './HamburgerMenu';
import { BranchControl } from './BranchControl';
import { OpenFileTabs } from './OpenFileTabs';
import { ConnectivityIndicator } from './ConnectivityIndicator';
import { ThemeLogo } from './brand';
import { useNavStore } from '../stores/useNavStore';

export interface TitleBarProps {
  brandName?: string;
  onHelpClick?: () => void;
  onUpdateClick?: () => void;
  onSettingsClick?: () => void;
  onExplorerClick?: () => void;
  onToggleSidebar?: () => void;
  hasUpdateAvailable?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  brandName = '40Labs',
  onHelpClick,
  onUpdateClick,
  onSettingsClick,
  onExplorerClick,
  onToggleSidebar,
  hasUpdateAvailable = false,
}) => {
  const shell = useAppShell();
  const isNavClosed = shell.navState === 'closed';
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = React.useState(false);

  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setIsSidebarMenuOpen((prev) => !prev);
    }
  };

  const handleExplorerClick = () => {
    if (onExplorerClick) {
      onExplorerClick();
    } else {
      setActiveScreen('explorer');
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

  const toggleButtonElement = (
    <button
      type="button"
      onClick={handleToggle}
      className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer no-drag select-none"
      data-tauri-drag-region="false"
      title={isNavClosed ? 'Show sidebar navigation (Ctrl+B)' : 'Toggle sidebar navigation (Ctrl+B)'}
      aria-label={isNavClosed ? 'Show sidebar navigation' : 'Toggle sidebar navigation'}
      aria-expanded={isSidebarMenuOpen}
    >
      <PanelLeft size={15} className={isNavClosed ? 'text-action-primary' : 'text-current'} />
    </button>
  );

  const sidebarMenuContent = (
    <div className="w-44 py-1 bg-surface-elevated border border-border rounded-md shadow-lg text-xs z-[150]">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border-subtle">
        Sidebar State
      </div>
      <button
        type="button"
        onClick={() => {
          shell.expandSidebar();
          setIsSidebarMenuOpen(false);
        }}
        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface-hover transition-colors ${shell.navState === 'open' ? 'text-action-primary font-semibold bg-surface-selected/50' : 'text-text-primary'}`}
      >
        <span>Expanded</span>
        {shell.navState === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-action-primary" />}
      </button>
      <button
        type="button"
        onClick={() => {
          shell.collapseSidebar();
          setIsSidebarMenuOpen(false);
        }}
        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface-hover transition-colors ${shell.navState === 'icon' ? 'text-action-primary font-semibold bg-surface-selected/50' : 'text-text-primary'}`}
      >
        <span>Icons Only</span>
        {shell.navState === 'icon' && <span className="w-1.5 h-1.5 rounded-full bg-action-primary" />}
      </button>
      <button
        type="button"
        onClick={() => {
          shell.hideSidebar();
          setIsSidebarMenuOpen(false);
        }}
        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface-hover transition-colors ${shell.navState === 'closed' ? 'text-action-primary font-semibold bg-surface-selected/50' : 'text-text-primary'}`}
      >
        <span>Hidden</span>
        {shell.navState === 'closed' && <span className="w-1.5 h-1.5 rounded-full bg-action-primary" />}
      </button>
    </div>
  );

  return (
    <div
      className="h-10 w-full flex items-center justify-between px-2 bg-app-bg select-none shrink-0 z-[110]"
    >
      {/* Left side: Sidebar Toggle, Logo, Hamburger Menu (App Shell Menu), File Tabs, Branch Control */}
      <div className="flex items-center gap-1.5 h-full min-w-0 no-drag shrink-0" data-tauri-drag-region="false">
        {/* Sidebar Toggle Button */}
        {onToggleSidebar ? (
          toggleButtonElement
        ) : (
          <Dropdown
            isOpen={isSidebarMenuOpen}
            onClose={() => setIsSidebarMenuOpen(false)}
            trigger={toggleButtonElement}
            placement="bottom-start"
          >
            {sidebarMenuContent}
          </Dropdown>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2 px-2 no-drag" data-tauri-drag-region="false">
          <ThemeLogo variant="mark" height={16} />
          <span className="font-heading font-bold text-xs tracking-tight text-text-primary">
            {brandName}
          </span>
        </div>

        {/* Hamburger Menu (App Shell Menu) - Opens File Explorer */}
        <HamburgerMenu
          onHelpClick={onHelpClick}
          onUpdateClick={onUpdateClick}
          onSettingsClick={onSettingsClick}
          onExplorerClick={handleExplorerClick}
          hasUpdateAvailable={hasUpdateAvailable}
        />

        {/* Opened File Tabs */}
        <OpenFileTabs />

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
