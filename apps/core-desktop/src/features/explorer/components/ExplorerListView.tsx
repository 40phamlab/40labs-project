import * as React from 'react';
import { Folder, CheckSquare, Square } from 'lucide-react';
import { FileTypeIcon } from '@40labs/ui-components';
import { type ExplorerItemMetadata } from '../../../api/explorerApi';

export interface ExplorerListViewProps {
  displayedItems: ExplorerItemMetadata[];
  selectedPaths: Set<string>;
  sortField: 'name' | 'modified_at' | 'size_bytes' | 'extension';
  sortOrder: 'asc' | 'desc';
  onSelectItem: (item: ExplorerItemMetadata, e: React.MouseEvent) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenFile: (item: ExplorerItemMetadata) => void;
  onContextMenu: (e: React.MouseEvent, item?: ExplorerItemMetadata) => void;
  onSortChange: (field: 'name' | 'modified_at' | 'size_bytes' | 'extension') => void;
  formatBytes: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
  getFileTypeLabel: (item: ExplorerItemMetadata) => string;
  className?: string;
}

export const ExplorerListView: React.FC<ExplorerListViewProps> = ({
  displayedItems,
  selectedPaths,
  sortField,
  sortOrder,
  onSelectItem,
  onSelectAll,
  onClearSelection,
  onOpenFile,
  onContextMenu,
  onSortChange,
  formatBytes,
  formatDate,
  getFileTypeLabel,
  className = '',
}) => {
  const allSelected = displayedItems.length > 0 && selectedPaths.size === displayedItems.length;

  return (
    <div className={`overflow-x-auto ${className}`} onContextMenu={(e) => onContextMenu(e)}>
      <table className="w-full text-left text-xs border-collapse select-none">
        <thead>
          <tr className="border-b border-[var(--color-border-default)] text-[var(--color-text-muted)] text-[11px] font-bold uppercase tracking-wider h-10 bg-[var(--color-surface-primary)] sticky top-0 z-10 font-heading">
            <th className="w-12 px-3 text-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (allSelected) {
                    onClearSelection();
                  } else {
                    onSelectAll();
                  }
                }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                title={allSelected ? 'Deselect All' : 'Select All'}
                aria-label={allSelected ? 'Deselect All' : 'Select All'}
              >
                {allSelected ? (
                  <CheckSquare size={16} className="text-[var(--color-action-primary)]" />
                ) : (
                  <Square size={16} />
                )}
              </button>
            </th>
            <th
              className="px-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors min-w-[260px]"
              onClick={() => onSortChange('name')}
            >
              <div className="flex items-center gap-1.5">
                <span>Name</span>
                {sortField === 'name' && (
                  <span className="text-[var(--color-action-primary)] font-bold">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th
              className="px-3 w-40 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
              onClick={() => onSortChange('extension')}
            >
              <div className="flex items-center gap-1.5">
                <span>Type</span>
                {sortField === 'extension' && (
                  <span className="text-[var(--color-action-primary)] font-bold">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th
              className="px-3 w-28 text-right cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
              onClick={() => onSortChange('size_bytes')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Size</span>
                {sortField === 'size_bytes' && (
                  <span className="text-[var(--color-action-primary)] font-bold">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th
              className="px-3 w-44 text-right cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
              onClick={() => onSortChange('modified_at')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Date Modified</span>
                {sortField === 'modified_at' && (
                  <span className="text-[var(--color-action-primary)] font-bold">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-default)]/30">
          {displayedItems.map((item) => {
            const isSelected = selectedPaths.has(item.path);
            return (
              <tr
                key={item.path}
                onClick={(e) => onSelectItem(item, e)}
                onDoubleClick={() => onOpenFile(item)}
                onContextMenu={(e) => onContextMenu(e, item)}
                className={`h-10 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-surface-selected)] text-[var(--color-text-primary)] font-medium shadow-xs border-l-2 border-[var(--color-action-primary)]'
                    : 'text-[var(--color-text-primary)]'
                }`}
              >
                <td className="px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => onSelectItem(item, e)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    aria-label={`Select ${item.name}`}
                  >
                    {isSelected ? (
                      <CheckSquare size={16} className="text-[var(--color-action-primary)]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-2.5">
                    {item.is_dir ? (
                      <Folder className="text-[var(--color-warning)] shrink-0" size={18} />
                    ) : (
                      <FileTypeIcon fileName={item.name} size={18} />
                    )}
                    <span className="truncate max-w-[400px]" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 text-[var(--color-text-muted)] truncate" title={getFileTypeLabel(item)}>
                  {getFileTypeLabel(item)}
                </td>
                <td className="px-3 text-right font-mono text-[var(--color-text-muted)] text-[11px]">
                  {item.is_dir ? '—' : formatBytes(item.size_bytes)}
                </td>
                <td className="px-3 text-right text-[var(--color-text-muted)] font-mono text-[11px]">
                  {formatDate(item.modified_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
