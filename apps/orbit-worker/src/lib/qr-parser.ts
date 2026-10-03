export interface ParsedPairQr {
  endpoint: string;
  sessionId: string;
  token: string;
  fp: string;
}

export function parsePairQr(qrString: string): ParsedPairQr {
  if (!qrString || typeof qrString !== 'string') {
    throw new Error('Invalid QR string');
  }

  if (!qrString.startsWith('orbit://pair?')) {
    throw new Error('Invalid QR scheme or action');
  }

  try {
    const url = new URL(qrString);
    if (url.protocol !== 'orbit:') {
      throw new Error('Unknown scheme');
    }

    const params = url.searchParams;

    // Check duplicate parameters
    const allKeys = Array.from(params.keys());
    const uniqueKeys = new Set(allKeys);
    if (allKeys.length !== uniqueKeys.size) {
      throw new Error('Duplicate parameters detected');
    }

    const endpoint = params.get('endpoint');
    const sessionId = params.get('sessionId');
    const token = params.get('token');
    const fp = params.get('fp');

    if (!endpoint || !sessionId || !token || !fp) {
      throw new Error('Missing required pairing parameters');
    }

    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(endpoint);
    } catch {
      throw new Error('Malformed endpoint URL');
    }

    if (parsedEndpoint.protocol !== 'https:') {
      throw new Error('Endpoint must use HTTPS');
    }

    if (endpoint.length > 512 || sessionId.length > 128 || token.length > 256 || fp.length > 128) {
      throw new Error('Parameter value exceeds maximum allowed length');
    }

    return {
      endpoint: parsedEndpoint.toString().replace(/\/$/, ''),
      sessionId,
      token,
      fp,
    };
  } catch (err: any) {
    if (err instanceof Error && err.message !== 'Invalid QR string' && err.message !== 'Invalid QR scheme or action') {
      throw err;
    }
    throw new Error('Malformed pairing QR code');
  }
}
