import { useConnectionStore } from '../src/stores/connection';
import * as SecureStore from '../src/lib/secure-store';

jest.mock('../src/lib/secure-store', () => ({
  listServerCredentials: jest.fn(),
  getServerCredential: jest.fn(),
}));

describe('Connection Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useConnectionStore.setState({
      status: 'unpaired',
      permissions: [],
      userInfo: null,
      activeBusinessId: null,
    });
  });

  it('sets status to unpaired when no servers are saved', async () => {
    (SecureStore.listServerCredentials as jest.Mock).mockResolvedValue([]);
    await useConnectionStore.getState().initialize();
    expect(useConnectionStore.getState().status).toBe('unpaired');
  });

  it('handles revocation on 401 response', async () => {
    (SecureStore.listServerCredentials as jest.Mock).mockResolvedValue([
      { businessId: 'biz-1', endpoint: 'https://hub.local', credential: 'bad-token' },
    ]);
    (SecureStore.getServerCredential as jest.Mock).mockResolvedValue({
      businessId: 'biz-1',
      endpoint: 'https://hub.local',
      credential: 'bad-token',
    });

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    await useConnectionStore.getState().initialize();
    expect(useConnectionStore.getState().status).toBe('revoked');
  });

  it('handles unreachable on network error', async () => {
    (SecureStore.listServerCredentials as jest.Mock).mockResolvedValue([
      { businessId: 'biz-1', endpoint: 'https://hub.local', credential: 'token' },
    ]);
    (SecureStore.getServerCredential as jest.Mock).mockResolvedValue({
      businessId: 'biz-1',
      endpoint: 'https://hub.local',
      credential: 'token',
    });

    (globalThis as any).fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    await useConnectionStore.getState().initialize();
    expect(useConnectionStore.getState().status).toBe('unreachable');
  });

  it('handles successful connection and populates permissions', async () => {
    (SecureStore.listServerCredentials as jest.Mock).mockResolvedValue([
      { businessId: 'biz-1', endpoint: 'https://hub.local', credential: 'good-token' },
    ]);
    (SecureStore.getServerCredential as jest.Mock).mockResolvedValue({
      businessId: 'biz-1',
      endpoint: 'https://hub.local',
      credential: 'good-token',
    });

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        id: 'dev-1',
        deviceLabel: 'Worker Phone',
        status: 'active',
        permissions: ['can_update_stock'],
      }),
    });

    await useConnectionStore.getState().initialize();
    expect(useConnectionStore.getState().status).toBe('connected');
    expect(useConnectionStore.getState().permissions).toEqual(['can_update_stock']);
  });
});
