import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../client';
import { FakeTransport } from '../fake-transport';
import { ApiError } from '../errors';

describe('ApiClient with FakeTransport', () => {
  let transport: FakeTransport;
  let client: ApiClient;

  beforeEach(() => {
    transport = new FakeTransport();
    client = new ApiClient({ transport });
  });

  it('handles success response and JSON data for pairing health', async () => {
    transport.setHandler('GET', '/api/pairing/health', () => ({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { status: 'healthy', version: '1.0.0' },
    }));

    const result = await client.getPairingHealth();
    expect(result).toEqual({ status: 'healthy', version: '1.0.0' });
  });

  it('handles JSON POST request for pairing device', async () => {
    transport.setHandler('POST', '/api/pairing/pair', (options) => {
      expect(options.body).toEqual({
        sessionId: 'session-123',
        token: 'token-456',
        deviceLabel: 'Worker Phone',
        deviceType: 'phone',
      });
      return {
        status: 200,
        headers: {},
        data: { credential: 'cred-secret-hash', businessId: 'bus-1' },
      };
    });

    const result = await client.pairDevice({
      sessionId: 'session-123',
      token: 'token-456',
      deviceLabel: 'Worker Phone',
      deviceType: 'phone',
    });
    expect(result).toEqual({ credential: 'cred-secret-hash', businessId: 'bus-1' });
  });

  it('handles GET devices/me with Authorization header', async () => {
    transport.setHandler('GET', '/api/v1/devices/me', (options) => {
      expect(options.headers?.Authorization).toBe('Bearer test-token');
      return {
        status: 200,
        headers: {},
        data: { id: 'dev-1', deviceLabel: 'Phone', status: 'active', permissions: ['can_update_stock'] },
      };
    });

    const result = await client.getDevicesMe('test-token');
    expect(result.status).toBe('active');
    expect(result.permissions).toContain('can_update_stock');
  });

  it('handles POST heartbeat', async () => {
    transport.setHandler('POST', '/api/v1/devices/me/heartbeat', (options) => {
      expect(options.headers?.Authorization).toBe('Bearer test-token');
      return {
        status: 200,
        headers: {},
        data: { status: 'ok' },
      };
    });

    const result = await client.postHeartbeat('test-token');
    expect(result.status).toBe('ok');
  });

  it('handles HTTP errors and maps to stable error codes', async () => {
    transport.setHandler('GET', '/api/v1/devices/me', () => ({
      status: 401,
      headers: {},
      data: { message: 'Unauthorized device' },
    }));

    try {
      await client.getDevicesMe('bad-token');
      expect.fail('Should have thrown ApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Unauthorized device');
    }
  });

  it('handles network errors', async () => {
    transport.setHandler('GET', '/api/pairing/health', () => {
      throw new Error('Network request failed');
    });

    try {
      await client.getPairingHealth();
      expect.fail('Should have thrown ApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe('NETWORK_ERROR');
    }
  });

  it('handles malformed JSON / syntax response', async () => {
    transport.setHandler('GET', '/api/pairing/health', () => {
      throw new SyntaxError('Unexpected token in JSON');
    });

    try {
      await client.getPairingHealth();
      expect.fail('Should have thrown ApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe('MALFORMED_RESPONSE');
    }
  });
});
