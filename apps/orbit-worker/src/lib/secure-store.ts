import * as SecureStore from 'expo-secure-store';

export interface ServerCredential {
  businessId: string;
  businessName: string;
  endpoint: string;
  credential: string;
  fp: string;
}

const STORAGE_KEY_PREFIX = 'orbit_server_';
const SERVERS_INDEX_KEY = 'orbit_servers_index';

export async function saveServerCredential(cred: ServerCredential): Promise<void> {
  if (!cred.businessId || !cred.endpoint || !cred.credential || !cred.fp) {
    throw new Error('Missing required credential fields');
  }

  const key = `${STORAGE_KEY_PREFIX}${cred.businessId}`;
  await SecureStore.setItemAsync(key, JSON.stringify(cred));

  const indexStr = await SecureStore.getItemAsync(SERVERS_INDEX_KEY);
  const index: string[] = indexStr ? JSON.parse(indexStr) : [];
  if (!index.includes(cred.businessId)) {
    index.push(cred.businessId);
    await SecureStore.setItemAsync(SERVERS_INDEX_KEY, JSON.stringify(index));
  }
}

export async function getServerCredential(businessId: string): Promise<ServerCredential | null> {
  const key = `${STORAGE_KEY_PREFIX}${businessId}`;
  const data = await SecureStore.getItemAsync(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as ServerCredential;
  } catch {
    return null;
  }
}

export async function listServerCredentials(): Promise<ServerCredential[]> {
  const indexStr = await SecureStore.getItemAsync(SERVERS_INDEX_KEY);
  if (!indexStr) return [];
  try {
    const index: string[] = JSON.parse(indexStr);
    const credentials: ServerCredential[] = [];
    for (const businessId of index) {
      const cred = await getServerCredential(businessId);
      if (cred) {
        credentials.push(cred);
      }
    }
    return credentials;
  } catch {
    return [];
  }
}

export async function removeServerCredential(businessId: string): Promise<void> {
  const key = `${STORAGE_KEY_PREFIX}${businessId}`;
  await SecureStore.deleteItemAsync(key);

  const indexStr = await SecureStore.getItemAsync(SERVERS_INDEX_KEY);
  if (indexStr) {
    try {
      const index: string[] = JSON.parse(indexStr);
      const newIndex = index.filter((id) => id !== businessId);
      await SecureStore.setItemAsync(SERVERS_INDEX_KEY, JSON.stringify(newIndex));
    } catch {
      // ignore
    }
  }
}
