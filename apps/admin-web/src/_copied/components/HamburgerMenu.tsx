// COPIED FROM: apps/core-desktop/src/components/HamburgerMenu.tsx
import * as React from 'react';
import { Menu as MenuIcon, Info } from 'lucide-react';
import { Dropdown, Menu, DropdownMenuItem } from '@40labs/ui-components';

export interface HamburgerMenuProps {
  onHelpClick?: () => void;
  onUpdateClick?: () => void;
  onSettingsClick?: () => void;
  onExplorerClick?: () => void;
  hasUpdateAvailable?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onSettingsClick,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);

  const triggerElement = (
    <button
      ref={triggerButtonRef}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="h-8 px-2.5 flex items-center gap-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer relative select-none"
      aria-label="Application Menu"
      aria-expanded={isOpen}
      title="Application Menu"
    >
      <MenuIcon size={16} />
    </button>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-start"
      trigger={triggerElement}
    >
      <Menu>
        <div className="px-3 py-2 border-b border-border-subtle mb-1">
          <p className="text-xs font-bold text-text-primary">40Labs Admin</p>
          <p className="text-[10px] text-text-muted mt-0.5">Version 0.1.0</p>
        </div>
        <DropdownMenuItem
          label={<span className="text-xs font-medium text-text-primary">Settings</span>}
          icon={<Info size={14} />}
          onClick={() => {
            onSettingsClick?.();
            setIsOpen(false);
          }}
        />
      </Menu>
    </Dropdown>
  );
};
