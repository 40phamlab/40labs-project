import * as React from 'react';
import {
  Menu as MenuIcon,
  Info,
  Package,
  RefreshCw,
  FilePlus,
  FileText,
  FolderOpen,
  Upload,
  ExternalLink,
  Command,
  MessageSquare
} from 'lucide-react';
import { Dropdown, Menu, DropdownMenuItem } from '@40labs/ui-components';

export interface HamburgerMenuProps {
  onHelpClick?: () => void;
  onUpdateClick?: () => void;
  onSettingsClick?: () => void;
  hasUpdateAvailable?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onHelpClick,
  onUpdateClick,
  onSettingsClick,
  hasUpdateAvailable = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const triggerElement = (
    <button
      ref={triggerButtonRef}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="h-8 px-2.5 flex items-center gap-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer relative no-drag select-none"
      data-tauri-drag-region="false"
      aria-label="Application Menu"
      aria-expanded={isOpen}
      title="Application Menu"
    >
      <MenuIcon size={16} />
      {hasUpdateAvailable && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-action-primary ring-2 ring-app-bg"
          title="Update available"
        />
      )}
    </button>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-start"
      trigger={triggerElement}
    >
      <div onKeyDown={handleKeyDown}>
        <Menu>
          <div className="px-3 py-2 border-b border-border-subtle mb-1">
            <p className="text-xs font-bold text-text-primary">40Labs Core</p>
            <p className="text-[10px] text-text-muted mt-0.5">Version 0.1.0-alpha</p>
          </div>
          <DropdownMenuItem label="About 40Labs" icon={<Info size={14} />} disabled />
          <DropdownMenuItem
            label="Workspace Settings"
            icon={<Package size={14} />}
            onClick={() => {
              onSettingsClick?.();
              handleClose();
            }}
          />
          <div className="h-px bg-border-subtle my-1" />
          <DropdownMenuItem
            label={
              <div className="flex items-center justify-between w-full">
                <span>Check for Updates...</span>
                {hasUpdateAvailable && (
                  <span className="px-1.5 py-0.2 rounded bg-action-primary/20 text-action-primary text-[9px] font-bold">
                    New
                  </span>
                )}
              </div>
            }
            icon={<RefreshCw size={14} />}
            onClick={() => {
              onUpdateClick?.();
              handleClose();
            }}
          />

          <div className="h-px bg-border-subtle my-1" />

          {/* Open Section */}
          <div className="px-3 py-1">
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Open</p>
          </div>
          <DropdownMenuItem label="New Window" icon={<FilePlus size={14} />} disabled />
          <DropdownMenuItem label="Open File..." icon={<FileText size={14} />} disabled />
          <DropdownMenuItem label="Open Folder..." icon={<FolderOpen size={14} />} disabled />
          <DropdownMenuItem label="Import Data" icon={<Upload size={14} />} disabled />

          <div className="h-px bg-border-subtle my-1" />

          {/* Help Section */}
          <div className="px-3 py-1">
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Help</p>
          </div>
          <DropdownMenuItem
            label="User Manual"
            icon={<ExternalLink size={14} />}
            onClick={() => {
              onHelpClick?.();
              handleClose();
            }}
          />
          <DropdownMenuItem label="Keyboard Shortcuts" icon={<Command size={14} />} disabled />
          <DropdownMenuItem label="Report an Issue" icon={<MessageSquare size={14} />} disabled />
        </Menu>
      </div>
    </Dropdown>
  );
};
