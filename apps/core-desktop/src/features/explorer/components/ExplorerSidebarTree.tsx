import * as React from 'react';
import { Folder, ChevronRight, ChevronDown, HardDrive } from 'lucide-react';
import { type ExplorerItemMetadata, type ExplorerDirectoryContent } from '../../../api/explorerApi';

export interface ExplorerSidebarTreeProps {
  currentPath: string;
  directoryData: ExplorerDirectoryContent | null;
  treeState: Record<string, { isExpanded: boolean; subdirs: ExplorerItemMetadata[] }>;
  onNavigate: (path: string) => void;
  onToggleTreeNode: (path: string) => void;
  onPickDirectory: () => void;
  onGetDefaultDirectory: () => Promise<string>;
  className?: string;
}

export const ExplorerSidebarTree: React.FC<ExplorerSidebarTreeProps> = ({
  currentPath,
  directoryData,
  treeState,
  onNavigate,
  onToggleTreeNode,
  onPickDirectory,
  onGetDefaultDirectory,
  className = '',
}) => {
  return (
    <div
      className={`w-64 border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)] flex flex-col shrink-0 overflow-hidden ${className}`}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-surface-secondary)]">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-heading flex items-center gap-1.5">
          <HardDrive size={14} className="text-[var(--color-action-primary)]" />
          <span>Explorer</span>
        </span>
        <button
          type="button"
          onClick={onPickDirectory}
          className="text-xs px-2.5 py-1 rounded-[var(--radius-input)] bg-[var(--color-app-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-action-primary)] hover:underline transition-colors cursor-pointer border border-[var(--color-border-default)] elevation-raised font-medium"
          title="Open native directory picker"
        >
          Browse...
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar text-xs">
        {/* Locations / Quick Access */}
        <div className="space-y-1">
          <div className="px-2 py-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-heading">
              Quick Access
            </h3>
          </div>
          <div
            onClick={() => {
              onGetDefaultDirectory().then(onNavigate);
            }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-input)] cursor-pointer transition-all ${
              currentPath.toLowerCase().includes('40labs')
                ? 'bg-[var(--color-surface-selected)] text-[var(--color-action-primary)] font-semibold shadow-xs border border-[var(--color-border-selected)]/40'
                : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] font-medium'
            }`}
          >
            <Folder size={16} className="text-[var(--color-warning)] shrink-0" />
            <span className="truncate">40Labs Root</span>
          </div>
        </div>

        {/* Folder Structure */}
        {directoryData && (
          <div className="space-y-1 pt-1 border-t border-[var(--color-border-default)]">
            <div className="px-2 py-1.5 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-heading">
                Folder Structure
              </h3>
            </div>
            <div className="space-y-0.5">
              {directoryData.items
                .filter((i) => i.is_dir)
                .map((sub) => {
                  const isExp = treeState[sub.path]?.isExpanded;
                  const isCurrent = currentPath === sub.path;
                  return (
                    <div key={sub.path} className="space-y-0.5">
                      <div
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-input)] cursor-pointer transition-all text-xs ${
                          isCurrent
                            ? 'bg-[var(--color-surface-selected)] text-[var(--color-action-primary)] font-bold shadow-xs border border-[var(--color-border-selected)]/40'
                            : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-medium'
                        }`}
                        onClick={() => onNavigate(sub.path)}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTreeNode(sub.path);
                          }}
                          className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded transition-colors"
                          aria-label={isExp ? 'Collapse folder' : 'Expand folder'}
                        >
                          {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <Folder size={15} className="text-[var(--color-warning)] shrink-0" />
                        <span className="truncate">{sub.name}</span>
                      </div>

                      {/* Expanded sub-folders with proper indentation */}
                      {isExp && treeState[sub.path]?.subdirs && (
                        <div className="pl-5 space-y-0.5 border-l border-[var(--color-border-default)] ml-3.5 my-0.5">
                          {treeState[sub.path].subdirs.map((child) => {
                            const isChildCurrent = currentPath === child.path;
                            return (
                              <div
                                key={child.path}
                                onClick={() => onNavigate(child.path)}
                                className={`flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-input)] cursor-pointer text-[11px] transition-colors ${
                                  isChildCurrent
                                    ? 'bg-[var(--color-surface-selected)] text-[var(--color-action-primary)] font-bold'
                                    : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                }`}
                              >
                                <Folder size={13} className="text-[var(--color-warning)]/80 shrink-0" />
                                <span className="truncate">{child.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
