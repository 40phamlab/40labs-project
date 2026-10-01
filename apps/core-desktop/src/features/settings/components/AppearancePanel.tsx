import * as React from 'react';
import { Panel, Toggle } from '@40labs/ui-components';
import type { Business } from '@40labs/types';
import type { UpdateBusinessPayload } from '../../../hooks/useBusiness';
import { Moon, Sun } from 'lucide-react';

interface AppearancePanelProps {
  business?: Business | null;
  onToggle: (payload: UpdateBusinessPayload) => Promise<void> | void;
  isLoading?: boolean;
}

export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  business,
  onToggle,
  isLoading = false,
}) => {
  const isDarkMode = business?.appearance_mode === 'dark';

  const handleToggle = async (checked: boolean) => {
    const nextMode = checked ? 'dark' : 'light';
    await onToggle({ appearance_mode: nextMode });
  };

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-2xl">
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Appearance</h3>
        </div>

        <div className="flex items-center justify-between p-4 bg-panel-subtle rounded-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary block">
                {isDarkMode ? 'Dark Clinical Theme (Active)' : 'Light Theme Mode'}
              </span>
            </div>
          </div>

          <Toggle
            checked={isDarkMode}
            onChange={handleToggle}
            disabled={isLoading}
            label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
          />
        </div>
      </Panel>
    </div>
  );
};
