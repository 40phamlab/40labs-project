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
import { AboutModal } from '../features/app-menu/AboutModal';
import { UpdatesModal } from '../features/app-menu/UpdatesModal';
import { KeyboardShortcutsModal } from '../features/app-menu/KeyboardShortcutsModal';
import { ReportIssueModal } from '../features/app-menu/ReportIssueModal';
import { useConnectivityStore } from '../stores/useConnectivityStore';
import { useBusiness } from '../hooks/useBusiness';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import { documentDir } from '@tauri-apps/api/path';
import { useFilePreview } from '../hooks/useFilePreview';
import { convertFileSrc } from '@tauri-apps/api/core';

export interface HamburgerMenuProps {
  onHelpClick?: () => void;
  onUpdateClick?: () => void;
  onSettingsClick?: () => void;
  hasUpdateAvailable?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onHelpClick,
  onUpdateClick: _onUpdateClick,
  onSettingsClick,
  hasUpdateAvailable = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);

  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [updatesOpen, setUpdatesOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const isOnline = useConnectivityStore((s) => s.status === 'online');
  const { business } = useBusiness();
  const { openBlob } = useFilePreview();

  const handleClose = () => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleNewWindow = async () => {
    handleClose();
    try {
      const label = `win-${Date.now()}`;
      new WebviewWindow(label, {
        url: 'index.html',
        title: '40LabsCore',
        width: 1200,
        height: 800,
      });
    } catch (err) {
      console.warn('Failed to open new window in this environment', err);
    }
  };

  const handleOpenFile = async () => {
    handleClose();
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [{ name: 'Supported Files', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'csv'] }],
      });
      if (selected && typeof selected === 'string') {
        const fileName = selected.split(/[\\/]/).pop() || 'file';
        const fileUrl = convertFileSrc(selected);
        const resp = await fetch(fileUrl);
        const blob = await resp.blob();
        openBlob({
          fileName,
          blob,
          mimeType: blob.type,
        });
      }
    } catch (err) {
      console.warn('Failed to open file dialog', err);
    }
  };

  const handleOpenFolder = async () => {
    handleClose();
    try {
      const docDir = await documentDir();
      const targetFolder = `${docDir}/40Labs`;
      await openPath(targetFolder);
    } catch (err) {
      console.warn('Failed to open folder', err);
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
    <>
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

            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">About 40Labs</span>}
              icon={<Info size={14} />}
              onClick={() => {
                setAboutOpen(true);
                handleClose();
              }}
            />
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">Workspace Settings</span>}
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
                  <span className="text-xs font-medium text-text-primary">Check for Updates...</span>
                  {hasUpdateAvailable && (
                    <span className="px-1.5 py-0.2 rounded bg-action-primary/20 text-action-primary text-[9px] font-bold">
                      New
                    </span>
                  )}
                </div>
              }
              icon={<RefreshCw size={14} />}
              onClick={() => {
                setUpdatesOpen(true);
                handleClose();
              }}
            />

            <div className="h-px bg-border-subtle my-1" />

            {/* Open Section */}
            <div className="px-3 py-1">
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Open</p>
            </div>
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">New Window</span>}
              icon={<FilePlus size={14} />}
              onClick={handleNewWindow}
            />
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">Open File...</span>}
              icon={<FileText size={14} />}
              onClick={handleOpenFile}
            />
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">Open Folder...</span>}
              icon={<FolderOpen size={14} />}
              onClick={handleOpenFolder}
            />
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">Import Data (CSV)</span>}
              icon={<Upload size={14} />}
              onClick={() => {
                handleClose();
              }}
            />

            <div className="h-px bg-border-subtle my-1" />

            {/* Help Section */}
            <div className="px-3 py-1">
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Help</p>
            </div>
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">User Manual</span>}
              icon={<ExternalLink size={14} />}
              onClick={() => {
                onHelpClick?.();
                handleClose();
              }}
            />
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">Keyboard Shortcuts</span>}
              icon={<Command size={14} />}
              onClick={() => {
                setShortcutsOpen(true);
                handleClose();
              }}
            />
            <DropdownMenuItem
              label={<span className="text-xs font-medium text-text-primary">Report an Issue</span>}
              icon={<MessageSquare size={14} />}
              onClick={() => {
                setReportOpen(true);
                handleClose();
              }}
            />
          </Menu>
        </div>
      </Dropdown>

      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        businessId={business?.business_id}
        workspaceName={business?.name}
      />
      <UpdatesModal
        isOpen={updatesOpen}
        onClose={() => setUpdatesOpen(false)}
        isOnline={isOnline}
      />
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <ReportIssueModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        businessId={business?.business_id}
      />
    </>
  );
};
