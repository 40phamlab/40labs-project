export interface ParsedPairQr {
  endpoint: string;
  endpoints: string[];
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

    const endpointsValue = params.get('endpoint');
    const sessionId = params.get('sessionId');
    const token = params.get('token');
    const fp = params.get('fp');

    if (!endpointsValue || !sessionId || !token || !fp) {
      throw new Error('Missing required pairing parameters');
    }

    const endpoints = endpointsValue.split('|').map((value) => {
      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        throw new Error('Malformed endpoint URL');
      }
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
        throw new Error('Pairing endpoints must be HTTPS origins');
      }
      if (!isPrivateIpv4(parsed.hostname) || !parsed.port || Number(parsed.port) < 1 || Number(parsed.port) > 65535) {
        throw new Error('Pairing endpoint must use a private IPv4 address and port');
      }
      return parsed.origin;
    });

    if (endpoints.length === 0 || endpoints.length > 8 || new Set(endpoints).size !== endpoints.length) {
      throw new Error('Invalid pairing endpoint list');
    }

    if (endpointsValue.length > 4096 || sessionId.length > 128 || token.length > 256 || !/^[a-f\d]{64}$/i.test(fp)) {
      throw new Error('Parameter value exceeds maximum allowed length');
    }

    return {
      endpoint: endpoints[0],
      endpoints,
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

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}
