'use client';

import * as React from 'react';
import {
  RefreshCw,
  Layers,
  ExternalLink,
  FilePlus,
  Upload,
  Command,
  MessageSquare,
  Info,
  Package,
  FolderOpen,
  FileText,
  PanelLeft
} from 'lucide-react';
import { MenuBar, MenuBarItem } from './MenuBar';
import { DropdownMenuItem } from './Menu';
import { IconButton } from '../primitives/IconButton';
import { useAppShell } from '../layout/AppShell';

export type AppStatus =
  | 'ready'
  | 'loading'
  | 'syncing'
  | 'offline'
  | 'error'
  | 'update available'
  | 'background task running';

export interface TopMenuBarProps {
  brandName?: string;
  onHelpClick?: () => void;
  onUpdateClick?: () => void;
  onSettingsClick?: () => void;
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
  systemStatus?: AppStatus;
  updateStatus?: AppStatus | 'up to date';
  className?: string;
}

const getSystemStatusConfig = (status: AppStatus) => {
  switch (status) {
    case 'ready':
      return { label: 'Ready', dotColor: 'bg-action-primary', animate: '' };
    case 'loading':
      return { label: 'Loading', dotColor: 'bg-warning', animate: 'animate-pulse' };
    case 'syncing':
      return { label: 'Syncing', dotColor: 'bg-info', animate: 'animate-pulse' };
    case 'offline':
      return { label: 'Offline', dotColor: 'bg-text-muted', animate: '' };
    case 'error':
      return { label: 'Error', dotColor: 'bg-danger', animate: '' };
    case 'update available':
      return { label: 'Update Available', dotColor: 'bg-action-primary', animate: 'animate-bounce' };
    case 'background task running':
      return { label: 'Task Running', dotColor: 'bg-warning', animate: 'animate-pulse' };
    default:
      return { label: 'Ready', dotColor: 'bg-action-primary', animate: '' };
  }
};

const getUpdateStatusConfig = (status: AppStatus | 'up to date') => {
  switch (status) {
    case 'up to date':
      return { label: "You're up to date", textColor: 'text-action-primary' };
    case 'ready':
      return { label: 'Up to date', textColor: 'text-action-primary' };
    case 'loading':
      return { label: 'Checking for updates...', textColor: 'text-warning' };
    case 'syncing':
      return { label: 'Syncing updates...', textColor: 'text-info' };
    case 'offline':
      return { label: 'Offline (cannot check updates)', textColor: 'text-text-muted' };
    case 'error':
      return { label: 'Failed to check updates', textColor: 'text-danger' };
    case 'update available':
      return { label: 'New update available!', textColor: 'text-action-primary font-bold' };
    case 'background task running':
      return { label: 'Background update running...', textColor: 'text-warning' };
    default:
      return { label: "You're up to date", textColor: 'text-action-primary' };
  }
};

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  brandName = "40Labs",
  onHelpClick,
  onUpdateClick,
  onSettingsClick,
  showSidebarToggle = true,
  onToggleSidebar,
  systemStatus = 'ready',
  updateStatus = 'up to date',
  className = "",
}) => {
  const shell = useAppShell();

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      shell.toggleSidebar();
    }
  };

  const isNavClosed = shell.navState === 'closed';
  const systemConfig = getSystemStatusConfig(systemStatus);
  const updateConfig = getUpdateStatusConfig(updateStatus);

  return (
    <div
      className={`h-10 w-full bg-top-chrome flex items-center justify-between px-2 select-none ${className}`}
      data-tauri-drag-region
    >
      <div className="flex items-center gap-1.5 h-full min-w-0 flex-1 no-drag">
        {showSidebarToggle && (
          <IconButton
            icon={<PanelLeft size={15} />}
            onClick={handleToggle}
            intent="ghost"
            size="sm"
            label={isNavClosed ? "Show sidebar navigation" : "Toggle sidebar navigation"}
            title={isNavClosed ? "Show sidebar navigation (Ctrl+B)" : "Toggle sidebar navigation (Ctrl+B)"}
            className={isNavClosed ? "text-action-primary hover:bg-surface-hover" : "text-text-muted hover:text-text-primary"}
          />
        )}

        <MenuBar>
          {/* 40Labs Brand Menu */}
          <MenuBarItem
            label={
              <div className="flex items-center gap-2 mr-1">
                <div className="w-4 h-4 bg-accent rounded flex items-center justify-center text-[9px] font-bold text-text-inverse">
                  40
                </div>
                <span className="font-heading font-bold text-xs tracking-tight text-text-primary">
                  {brandName}
                </span>
              </div>
            }
          >
            <div className="px-3 py-2 border-b border-border-subtle mb-1">
              <p className="text-xs font-bold text-text-primary">40Labs Core</p>
              <p className="text-[10px] text-text-muted mt-0.5">Version 0.1.0-alpha</p>
            </div>
            <DropdownMenuItem label="About 40Labs" icon={<Info size={14} />} disabled />
            <DropdownMenuItem label="Workspace Settings" icon={<Package size={14} />} onClick={onSettingsClick} />
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="Check for Updates..." icon={<RefreshCw size={14} />} onClick={onUpdateClick} />
          </MenuBarItem>

          {/* Open Menu */}
          <MenuBarItem label="Open">
            <DropdownMenuItem label="New Window" icon={<FilePlus size={14} />} disabled />
            <DropdownMenuItem label="Open File..." icon={<FileText size={14} />} disabled />
            <DropdownMenuItem label="Open Folder..." icon={<FolderOpen size={14} />} disabled />
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="Import Data" icon={<Upload size={14} />} disabled />
            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Recent</p>
              <p className="text-[10px] text-text-muted italic px-1 py-0.5">No recent items</p>
            </div>
          </MenuBarItem>

          {/* Branch Menu - RESERVED */}
          <MenuBarItem
            label={
              <div className="flex items-center gap-1.5 opacity-50" aria-disabled="true">
                <Layers size={13} />
                <span>Branch</span>
              </div>
            }
            disabled
            aria-disabled="true"
            title="Multi-branch — coming in a later version"
          >
            <div className="px-3 py-2 max-w-[200px]" title="Multi-branch — coming in a later version">
              <p className="text-ui-small font-bold text-text-primary">Switch Branch</p>
              <p className="text-mono text-text-muted mt-1 leading-relaxed">
                Multi-branch — coming in a later version
              </p>
            </div>
          </MenuBarItem>

          {/* Help Menu */}
          <MenuBarItem label="Help">
            <DropdownMenuItem
              label="User Manual"
              icon={<ExternalLink size={14} />}
              onClick={() => onHelpClick?.()}
            />
            <DropdownMenuItem label="Keyboard Shortcuts" icon={<Command size={14} />} disabled />
            <DropdownMenuItem label="Report an Issue" icon={<MessageSquare size={14} />} disabled />
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="About" icon={<Info size={14} />} disabled />
          </MenuBarItem>

          {/* Updates Menu */}
          <MenuBarItem
            label={
              <div className="flex items-center gap-1.5">
                <RefreshCw size={13} className="text-action-primary" />
                <span>Updates</span>
              </div>
            }
          >
            <div className="px-3 py-2">
              <div className={`flex items-center gap-2 ${updateConfig.textColor}`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-current ${systemConfig.animate}`} />
                <span className="text-[11px] font-bold">{updateConfig.label}</span>
              </div>
            </div>
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="Check for Updates" icon={<RefreshCw size={14} />} onClick={onUpdateClick} />
            <DropdownMenuItem label="View Changelog" icon={<FileText size={14} />} disabled />
          </MenuBarItem>
        </MenuBar>
      </div>

      {/* System Status */}
      <div className="hidden sm:flex items-center gap-2 pr-2 pointer-events-none shrink-0">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${systemConfig.dotColor} ${systemConfig.animate}`} />
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
            {systemConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
};
