// COPIED FROM: apps/core-desktop/src/components/TitleBar.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelLeft, Minus, Square, X, Search } from 'lucide-react';
import { useAppShell } from '@40labs/ui-components';
import { HamburgerMenu } from './HamburgerMenu';
import { BranchControl } from './BranchControl';
import { OpenFileTabs } from './OpenFileTabs';
import { ConnectivityIndicator } from './ConnectivityIndicator';
import { ThemeLogo } from './brand/ThemeLogo';

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
  brandName = '40Labs Admin',
  onHelpClick,
  onUpdateClick,
  onSettingsClick,
  onExplorerClick,
  onToggleSidebar,
  hasUpdateAvailable = false,
}) => {
  const shell = useAppShell();
  const navigate = useNavigate();
  const isNavClosed = shell.navState === 'closed';
  const [globalSearch, setGlobalSearch] = React.useState('');

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      shell.toggleSidebar();
    }
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/businesses?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const handleMinimize = () => {};
  const handleMaximize = () => {};
  const handleClose = () => {};

  return (
    <div className="h-10 w-full flex items-center justify-between px-2 bg-app-bg select-none shrink-0 z-[110]">
      <div className="flex items-center gap-1.5 h-full min-w-0 shrink-0">
        <button
          type="button"
          onClick={handleToggle}
          className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none cursor-pointer select-none"
          title="Toggle sidebar navigation"
          aria-label="Toggle sidebar navigation"
        >
          <PanelLeft size={15} className={isNavClosed ? 'text-action-primary' : 'text-current'} />
        </button>

        <div className="flex items-center gap-2 px-2">
          <ThemeLogo variant="mark" height={16} />
          <span className="font-heading font-bold text-xs tracking-tight text-text-primary">
            {brandName}
          </span>
        </div>

        <HamburgerMenu
          onHelpClick={onHelpClick}
          onUpdateClick={onUpdateClick}
          onSettingsClick={onSettingsClick}
          onExplorerClick={onExplorerClick}
          hasUpdateAvailable={hasUpdateAvailable}
        />

        <OpenFileTabs />
        <BranchControl />

        <form onSubmit={handleGlobalSearchSubmit} className="relative hidden md:flex items-center ml-2">
          <Search size={13} className="absolute left-2.5 text-text-muted" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search businesses..."
            className="w-40 lg:w-56 pl-7 pr-2 py-1 bg-surface border border-border rounded text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary"
          />
        </form>
      </div>

      <div className="flex-1 h-full" />

      <div className="flex items-center gap-2 shrink-0 h-full">
        <div data-testid="status-indicator-slot" className="flex items-center px-2">
          <ConnectivityIndicator />
        </div>

        <div className="flex h-full items-center">
          <button
            type="button"
            onClick={handleMinimize}
            className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-full flex items-center justify-center text-text-muted hover:text-white hover:bg-danger transition-colors cursor-pointer"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
