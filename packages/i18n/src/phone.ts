// [PHASE: MVP]
/**
 * Normalizes a Tanzanian phone number input to E.164 format (+255XXXXXXXXX).
 * Accepts: 0XXXXXXXXX, 255XXXXXXXXX, +255XXXXXXXXX (with optional spaces/dashes).
 * Rejects otherwise (returns null).
 */
export function normalizePhoneTZ(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (hasPlus) {
    if (digits.startsWith('255') && digits.length === 12) {
      return `+${digits}`;
    }
  } else {
    if (digits.startsWith('255') && digits.length === 12) {
      return `+${digits}`;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return `+255${digits.slice(1)}`;
    }
  }
  return null;
}

/**
 * Formats an E.164 Tanzanian phone number for display: "+255712345678" -> "0712 345 678".
 */
export function formatPhoneTZ(e164: string): string {
  const norm = normalizePhoneTZ(e164);
  if (!norm) return e164;
  const local = '0' + norm.slice(4);
  if (local.length === 10) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 10)}`;
  }
  return local;
}
