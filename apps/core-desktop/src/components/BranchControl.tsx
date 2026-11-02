import * as React from 'react';
import { Layers } from 'lucide-react';
import { Dropdown, Menu, DropdownMenuItem } from '@40labs/ui-components';
import { branchesApi } from '../api/branchesApi';
import type { Branch } from '@40labs/types';

export interface BranchControlProps {
  currentBranch?: string;
  onBranchChange?: (branchName: string) => void;
}

export const BranchControl: React.FC<BranchControlProps> = ({
  currentBranch = 'Main Branch (Production)',
  onBranchChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      branchesApi
        .list()
        .then((data) => {
          if (data && data.length > 0) {
            setBranches(data);
          } else {
            setBranches([
              {
                id: 'main',
                name: 'Main Branch (Production)',
                business_id: 'AFYA-1001',
                location: 'Dar es Salaam',
                status: 'active',
                created_at: '',
                updated_at: '',
                workspace_id: '',
                branch_id: 'main',
              } as Branch,
            ]);
          }
        })
        .catch((err) => {
          console.error('Failed to load registered branches:', err);
        });
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const triggerElement = (
    <button
      ref={triggerButtonRef}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="h-8 px-2.5 max-w-[180px] sm:max-w-[220px] flex items-center gap-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer no-drag select-none text-xs"
      data-tauri-drag-region="false"
      title={`Current Branch: ${currentBranch} (Multi-branch support)`}
      aria-label={`Branch: ${currentBranch}`}
      aria-expanded={isOpen}
    >
      <Layers size={13} className="shrink-0 text-action-primary" />
      <span className="truncate">{currentBranch}</span>
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
        <div className="px-3 py-1.5 border-b border-border-subtle mb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Switch Branch</p>
        </div>
        {branches.length === 0 ? (
          <div className="px-3 py-2 text-xs text-text-muted">No registered branches found</div>
        ) : (
          branches.map((b) => (
            <DropdownMenuItem
              key={b.id}
              label={b.name}
              onClick={() => {
                onBranchChange?.(b.name);
                handleClose();
              }}
              className={b.name === currentBranch ? 'font-bold text-action-primary' : ''}
            />
          ))
        )}
      </Menu>
    </Dropdown>
  );
};
