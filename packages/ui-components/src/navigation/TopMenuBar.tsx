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
  FileText
} from 'lucide-react';
import { MenuBar, MenuBarItem } from './MenuBar';
import { DropdownMenuItem } from './Menu';

export interface TopMenuBarProps {
  brandName?: string;
  onHelpClick?: () => void;
  onUpdateClick?: () => void;
  className?: string;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  brandName = "40Labs",
  onHelpClick,
  onUpdateClick,
  className = "",
}) => {
  return (
    <div
      className={`h-10 w-full bg-top-chrome border-b border-border flex items-center justify-between px-3 select-none ${className}`}
      data-tauri-drag-region
    >
      <div className="flex items-center gap-1 h-full">
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
            <DropdownMenuItem label="About 40Labs" icon={<Info size={14} />} />
            <DropdownMenuItem label="Workspace Settings" icon={<Package size={14} />} />
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="Check for Updates..." icon={<RefreshCw size={14} />} onClick={onUpdateClick} />
          </MenuBarItem>

          {/* Open Menu */}
          <MenuBarItem label="Open">
            <DropdownMenuItem label="New Window" icon={<FilePlus size={14} />} />
            <DropdownMenuItem label="Open File..." icon={<FileText size={14} />} />
            <DropdownMenuItem label="Open Folder..." icon={<FolderOpen size={14} />} />
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="Import Data" icon={<Upload size={14} />} />
            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Recent</p>
              <p className="text-[10px] text-text-muted italic px-1 py-0.5">No recent items</p>
            </div>
          </MenuBarItem>

          {/* Branch Menu - RESERVED */}
          <MenuBarItem
            label={
              <div className="flex items-center gap-1.5 opacity-50">
                <Layers size={13} />
                <span>Branch</span>
              </div>
            }
            disabled
          >
            <div className="px-3 py-2 max-w-[200px]">
              <p className="text-[11px] font-bold text-text-primary">Switch Branch</p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed italic">
                Multi-branch support is scheduled for the v3.5 update.
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
            <DropdownMenuItem label="Keyboard Shortcuts" icon={<Command size={14} />} />
            <DropdownMenuItem label="Report an Issue" icon={<MessageSquare size={14} />} />
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="About" icon={<Info size={14} />} />
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
              <div className="flex items-center gap-2 text-action-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-[11px] font-bold">You're up to date</span>
              </div>
            </div>
            <div className="h-px bg-border-subtle my-1" />
            <DropdownMenuItem label="Check for Updates" icon={<RefreshCw size={14} />} onClick={onUpdateClick} />
            <DropdownMenuItem label="View Changelog" icon={<FileText size={14} />} />
          </MenuBarItem>
        </MenuBar>
      </div>

      {/* System Status */}
      <div className="flex items-center gap-2 pr-2 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-action-primary" />
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Ready</span>
        </div>
      </div>
    </div>
  );
};
