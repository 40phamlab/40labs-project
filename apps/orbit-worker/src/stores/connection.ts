import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { getServerCredential, listServerCredentials } from '../lib/secure-store';
import { ApiClient, ApiError } from '@40labs/api-client';

export type ConnectionState = 'unpaired' | 'connecting' | 'connected' | 'unreachable' | 'revoked';

interface ConnectionStore {
  status: ConnectionState;
  permissions: string[];
  userInfo: { id?: string; deviceLabel?: string; role?: string } | null;
  activeBusinessId: string | null;
  setStatus: (status: ConnectionState) => void;
  setUserInfo: (info: any, permissions: string[]) => void;
  initialize: () => Promise<void>;
  heartbeat: () => Promise<void>;
  startMonitoring: () => () => void;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  status: 'unpaired',
  permissions: [],
  userInfo: null,
  activeBusinessId: null,

  setStatus: (status) => set({ status }),
  setUserInfo: (userInfo, permissions) => set({ userInfo, permissions }),

  initialize: async () => {
    const servers = await listServerCredentials();
    if (servers.length === 0) {
      set({ status: 'unpaired' });
      return;
    }
    const server = servers[0];
    set({ activeBusinessId: server.businessId });
    await get().heartbeat();
  },

  heartbeat: async () => {
    const { activeBusinessId, status } = get();
    if (!activeBusinessId) {
      set({ status: 'unpaired' });
      return;
    }

    const server = await getServerCredential(activeBusinessId);
    if (!server) {
      set({ status: 'unpaired' });
      return;
    }

    if (status !== 'connected' && status !== 'unreachable') {
      set({ status: 'connecting' });
    }

    try {
      const client = new ApiClient({
        baseUrl: server.endpoint,
        transport: {
          request: async (opts) => {
            const response = await fetch(`${server.endpoint}${opts.path}`, {
              method: opts.method,
              headers: {
                ...opts.headers,
              },
              body: opts.body ? JSON.stringify(opts.body) : undefined,
              signal: opts.signal,
            });
            const data = await response.json().catch(() => ({}));
            return {
              status: response.status,
              headers: {},
              data,
            };
          },
        },
      });

      const deviceMe = await client.getDevicesMe(server.credential);
      if (deviceMe.status === 'revoked' || deviceMe.status === 'blocked') {
        set({ status: 'revoked' });
        return;
      }

      set({
        status: 'connected',
        permissions: deviceMe.permissions || [],
        userInfo: { id: deviceMe.id, deviceLabel: deviceMe.deviceLabel },
      });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403 || err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN') {
          set({ status: 'revoked' });
          return;
        }
      }
      set({ status: 'unreachable' });
    }
  },

  startMonitoring: () => {
    const interval = setInterval(() => {
      get().heartbeat();
    }, 20000);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        get().heartbeat();
      }
    };
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        get().heartbeat();
      } else {
        set({ status: 'unreachable' });
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  },
}));
