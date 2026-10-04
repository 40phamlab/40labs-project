import { parsePairQr } from '../src/lib/qr-parser';
import { useConnectionStore } from '../src/stores/connection';

describe('Connection & Uploaded QR Requirements', () => {
  it('1. Valid QR string parsed successfully', () => {
    const validQr = 'orbit://pair?endpoint=https://192.168.1.100:8443&sessionId=sess_123&token=secrettoken&fp=AA:BB:CC';
    const parsed = parsePairQr(validQr);
    expect(parsed.endpoint).toBe('https://192.168.1.100:8443');
    expect(parsed.sessionId).toBe('sess_123');
    expect(parsed.token).toBe('secrettoken');
    expect(parsed.fp).toBe('AA:BB:CC');
  });

  it('2. Invalid Orbit QR format rejected', () => {
    const invalidQr = 'https://example.com/not-orbit';
    expect(() => parsePairQr(invalidQr)).toThrow();
  });

  it('3. QR with HTTP endpoint rejected', () => {
    const httpQr = 'orbit://pair?endpoint=http://192.168.1.100:8443&sessionId=sess_123&token=secrettoken&fp=AA:BB:CC';
    expect(() => parsePairQr(httpQr)).toThrow();
  });

  it('4. QR with missing fields rejected', () => {
    const missingQr = 'orbit://pair?endpoint=https://192.168.1.100:8443&sessionId=sess_123';
    expect(() => parsePairQr(missingQr)).toThrow();
  });

  it('5. Connection store initial state defaults to unpaired when no servers exist', async () => {
    const store = useConnectionStore.getState();
    expect(store.status).toBe('unpaired');
    expect(store.activeBusinessId).toBeNull();
  });
});
