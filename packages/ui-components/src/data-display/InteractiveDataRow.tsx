import React from 'react';
import { Avatar } from '../primitives/Avatar';
import { Switch } from '../forms/Switch';

export interface DataColumn {
  key: string;
  value: string | React.ReactNode;
  width?: string;
}

export interface InteractiveDataRowProps {
  id: string;
  avatarUrl?: string;
  name?: string;
  columns: DataColumn[];
  toggleConfig?: {
    isActive: boolean;
    onToggle: (state: boolean) => void;
  };
  className?: string;
}

/**
 * InteractiveDataRow
 * A horizontal row for list displays with support for avatars, dynamic columns, and an optional toggle.
 */
export const InteractiveDataRow: React.FC<InteractiveDataRowProps> = ({
  id,
  avatarUrl,
  name,
  columns,
  toggleConfig,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center gap-4 px-4 py-3 rounded-input transition-all duration-150
        hover:bg-panel-strong/30 hover:elevation-inset border-b border-border/10
        ${className}
      `}
    >
      {(avatarUrl || name) && (
        <Avatar
          src={avatarUrl}
          name={name || 'User'}
          size="sm"
          className="elevation-flat"
        />
      )}

      <div className="flex-1 grid grid-flow-col auto-cols-fr gap-4">
        {columns.map((col) => (
          <div
            key={col.key}
            style={{ width: col.width }}
            className="flex flex-col justify-center min-w-0"
          >
            <div className="text-xs text-text truncate font-medium">
              {col.value}
            </div>
          </div>
        ))}
      </div>

      {toggleConfig && (
        <div className="shrink-0 flex items-center pl-2">
          <Switch
            checked={toggleConfig.isActive}
            onChange={toggleConfig.onToggle}
            id={`row-toggle-${id}`}
          />
        </div>
      )}
    </div>
  );
};
