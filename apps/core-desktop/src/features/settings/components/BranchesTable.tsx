import * as React from 'react';
import {
  DataTable,
  StatusBadge,
  type ColumnDefinition,
  IconButton,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  Panel,
} from '@40labs/ui-components';
import { MoreVertical, Plus, Edit, Power } from 'lucide-react';
import type { Branch } from '@40labs/types';

interface BranchesTableProps {
  branches: Branch[];
  onAddBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onDeactivateBranch: (branch: Branch) => void;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
}

const RowActions = ({
  branch,
  onEdit,
  onDeactivate,
}: {
  branch: Branch;
  onEdit: (branch: Branch) => void;
  onDeactivate: (branch: Branch) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <IconButton
          icon={<MoreVertical size={14} />}
          label="Branch Actions"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        />
      }
    >
      <DropdownMenuItem
        label="Edit Branch"
        icon={<Edit size={14} />}
        onClick={() => {
          onEdit(branch);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label={branch.status === 'active' ? 'Deactivate Branch' : 'Activate Branch'}
        icon={<Power size={14} />}
        variant={branch.status === 'active' ? 'danger' : 'default'}
        onClick={() => {
          onDeactivate(branch);
          setIsOpen(false);
        }}
      />
    </DropdownMenu>
  );
};

export const BranchesTable: React.FC<BranchesTableProps> = ({
  branches,
  onAddBranch,
  onEditBranch,
  onDeactivateBranch,
  loading,
  error,
  onRetry,
}) => {
  const columns: ColumnDefinition<Branch>[] = [
    {
      key: 'name',
      header: 'Branch Name',
      render: (branch) => (
        <span className="font-semibold text-text-primary">{branch.name}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (branch) => (
        <span className="text-xs text-text-secondary">{branch.location}</span>
      ),
    },
    {
      key: 'branch_code',
      header: 'Branch Code',
      accessorKey: 'branch_code',
      className: 'font-mono text-xs',
    },
    {
      key: 'status',
      header: 'Status',
      render: (branch) => (
        <StatusBadge
          status={branch.status}
          label={branch.status}
        />
      ),
    },
    {
      key: 'contacts',
      header: 'Contacts',
      render: (branch) => (
        <span className="text-xs font-mono text-text-secondary">
          {branch.contacts || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      render: (branch) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => onEditBranch(branch)}
          >
            Edit
          </Button>
          <RowActions
            branch={branch}
            onEdit={onEditBranch}
            onDeactivate={onDeactivateBranch}
          />
        </div>
      ),
    },
  ];

  return (
    <Panel variant="raised" className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Associated Branches</h3>
          <p className="text-xs text-text-muted">
            Manage physical outlets, regional dispensaries, and inventory distribution points.
          </p>
        </div>
        <Button
          type="button"
          intent="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={onAddBranch}
        >
          Add Branch
        </Button>
      </div>

      <div className="border border-border/50 rounded-card overflow-hidden">
        <DataTable
          data={branches}
          columns={columns}
          loading={loading}
          error={error}
          onRetry={onRetry}
          emptyMessage="No branches found."
          keyExtractor={(branch) => branch.id}
          density="compact"
        />
      </div>
    </Panel>
  );
};
