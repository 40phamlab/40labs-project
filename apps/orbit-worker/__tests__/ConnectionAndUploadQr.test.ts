import { parsePairQr } from '../src/lib/qr-parser';
import { useConnectionStore } from '../src/stores/connection';

describe('Connection & Uploaded QR Requirements', () => {
  it('1. Valid QR string parsed successfully', () => {
    const validQr = 'orbit://pair?endpoint=https://192.168.1.100:8443&sessionId=sess_123&token=secrettoken&fp=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const parsed = parsePairQr(validQr);
    expect(parsed.endpoint).toBe('https://192.168.1.100:8443');
    expect(parsed.sessionId).toBe('sess_123');
    expect(parsed.token).toBe('secrettoken');
    expect(parsed.fp).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('2. Invalid Orbit QR format rejected', () => {
    const invalidQr = 'https://example.com/not-orbit';
    expect(() => parsePairQr(invalidQr)).toThrow();
  });

  it('3. QR with HTTP endpoint rejected', () => {
    const httpQr = 'orbit://pair?endpoint=http://192.168.1.100:8443&sessionId=sess_123&token=secrettoken&fp=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
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
