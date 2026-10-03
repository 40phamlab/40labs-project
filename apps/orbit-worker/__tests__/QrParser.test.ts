import { parsePairQr } from '../src/lib/qr-parser';

describe('QR Parser', () => {
  it('parses valid https pairing QR string successfully', () => {
    const qr = 'orbit://pair?endpoint=https://192.168.1.50:8443&sessionId=123e4567-e89b-12d3-a456-426614174000&token=abc123token&fp=A1B2C3D4E5F6';
    const result = parsePairQr(qr);
    expect(result).toEqual({
      endpoint: 'https://192.168.1.50:8443',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      token: 'abc123token',
      fp: 'A1B2C3D4E5F6',
    });
  });

  it('rejects HTTP endpoint', () => {
    const qr = 'orbit://pair?endpoint=http://192.168.1.50:8443&sessionId=123&token=abc&fp=123';
    expect(() => parsePairQr(qr)).toThrow();
  });

  it('rejects unknown scheme or action', () => {
    const qr = 'http://example.com/pair?endpoint=https://a.com&sessionId=1&token=a&fp=1';
    expect(() => parsePairQr(qr)).toThrow();
  });

  it('rejects missing required fields', () => {
    const qr = 'orbit://pair?endpoint=https://192.168.1.50:8443&sessionId=123&token=abc'; // missing fp
    expect(() => parsePairQr(qr)).toThrow();
  });

  it('rejects duplicate parameters', () => {
    const qr = 'orbit://pair?endpoint=https://a.com&endpoint=https://b.com&sessionId=1&token=a&fp=1';
    expect(() => parsePairQr(qr)).toThrow();
  });

  it('rejects malformed URLs', () => {
    const qr = 'orbit://pair?endpoint=not-a-url&sessionId=1&token=a&fp=1';
    expect(() => parsePairQr(qr)).toThrow();
  });
});
