// [PHASE: MVP]
/**
 * Normalizes a Tanzanian phone number input to E.164 digits format (255XXXXXXXXX).
 * Accepts: 0XXXXXXXXX, 255XXXXXXXXX, +255XXXXXXXXX, XXXXXXXXX (9 digits starting with 6 or 7).
 * Rejects otherwise (returns null).
 */
export function normalizePhoneTZ(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');

  let normalized: string | null = null;
  if (digits.startsWith('255') && digits.length === 12) {
    normalized = digits;
  } else if (digits.startsWith('0') && digits.length === 10) {
    normalized = `255${digits.slice(1)}`;
  } else if (digits.length === 9) {
    normalized = `255${digits}`;
  }

  if (normalized && /^255[67]\d{8}$/.test(normalized)) {
    return normalized;
  }
  return null;
}

/**
 * Formats an E.164 Tanzanian phone number for display: "255712345678" or "+255712345678" -> "0712 345 678".
 */
export function formatPhoneTZ(e164: string): string {
  const norm = normalizePhoneTZ(e164);
  if (!norm) return e164;
  const local = '0' + norm.slice(3);
  if (local.length === 10) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 10)}`;
  }
  return local;
}
