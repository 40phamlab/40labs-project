import type { IntegrationsConfig } from '@40labs/types';
import { initialIntegrationsConfig } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export type UpdateIntegrationsPayload = Partial<Omit<IntegrationsConfig, 'id' | 'workspace_id' | 'branch_id' | 'created_at' | 'updated_at'>>;

let integrationsStore: IntegrationsConfig = { ...initialIntegrationsConfig };

export const integrationsApi = {
  get: async (): Promise<IntegrationsConfig> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<IntegrationsConfig>('get_integrations_config');
    }
    return { ...integrationsStore };
  },

  update: async (payload: UpdateIntegrationsPayload): Promise<IntegrationsConfig> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<IntegrationsConfig>('update_integrations_config', { payload });
    }
    const now = new Date().toISOString();
    integrationsStore = {
      ...integrationsStore,
      ...payload,
      updated_at: now,
    };
    return { ...integrationsStore };
  },
};

export const integrations = integrationsApi;
