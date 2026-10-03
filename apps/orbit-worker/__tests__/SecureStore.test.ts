import { saveServerCredential, getServerCredential, listServerCredentials, removeServerCredential } from '../src/lib/secure-store';
import * as SecureStore from 'expo-secure-store';

describe('SecureStore Credential Wrapper', () => {
  beforeEach(async () => {
    // clear mock secure store
    // @ts-ignore
    if (SecureStore.__clearMockStore) {
      // @ts-ignore
      SecureStore.__clearMockStore();
    }
  });

  it('saves and retrieves server credentials', async () => {
    const cred = {
      businessId: 'biz-1',
      businessName: 'Pharmacy A',
      endpoint: 'https://192.168.1.50:8443',
      credential: 'secret-hash-cred',
      fp: 'AA:BB:CC',
    };

    await saveServerCredential(cred);
    const retrieved = await getServerCredential('biz-1');
    expect(retrieved).toEqual(cred);

    const list = await listServerCredentials();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(cred);

    await removeServerCredential('biz-1');
    const afterRemove = await getServerCredential('biz-1');
    expect(afterRemove).toBeNull();
  });
});
