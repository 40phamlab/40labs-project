import React from 'react';
import { Avatar } from '../primitives/Avatar';
import { Button, ButtonIntent } from '../primitives/Button';
import { StatusBadge, StatusType } from '../data-display/StatusBadge';
import { Badge } from '../primitives/Badge';

export interface EntityProfileAction {
  id: string;
  label: string;
  variant?: ButtonIntent;
  onClick: () => void;
}

export interface EntityProfileHeaderProps {
  entity: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    statusIndicator?: 'active' | 'inactive' | 'warn';
    verifications?: string[];
  };
  actions: EntityProfileAction[];
  className?: string;
}

export const EntityProfileHeader: React.FC<EntityProfileHeaderProps> = ({
  entity,
  actions,
  className = '',
}) => {
  const statusMap: Record<string, StatusType> = {
    active: 'active',
    inactive: 'inactive',
    warn: 'warning',
  };

  return (
    <div
      className={`
        flex items-center gap-6 p-6 bg-panel rounded-card elevation-raised shadow-inner-soft
        ${className}
      `}
    >
      <Avatar
        src={entity.avatarUrl}
        name={entity.name}
        size="xl"
        className="elevation-raised"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold text-text truncate">{entity.name}</h2>
          {entity.statusIndicator && (
            <StatusBadge status={statusMap[entity.statusIndicator] || 'inactive'} />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-0.5">
            {entity.email && (
              <p className="text-sm text-text-muted truncate">{entity.email}</p>
            )}
            {entity.phone && (
              <p className="text-xs font-mono text-text-muted">{entity.phone}</p>
            )}
          </div>

          {entity.verifications && entity.verifications.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              {entity.verifications.map((v) => (
                <Badge key={v} size="sm" variant="info">
                  {v}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions.map((action) => (
          <Button
            key={action.id}
            intent={(action.variant as ButtonIntent) || 'secondary'}
            onClick={action.onClick}
            size="sm"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
