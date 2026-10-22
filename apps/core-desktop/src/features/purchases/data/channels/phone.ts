// [PHASE: marketplace-preview — Data foundation]

export function normalizeToE164(raw: string, defaultCc: string = '255'): string | null {
  if (!raw || typeof raw !== 'string') return null;

  // Split on typical delimiters: '/', ',', ';'
  const segments = raw.split(/[\/,;]/);

  for (const segment of segments) {
    let cleaned = segment.trim();
    if (!cleaned) continue;

    const hasPlus = cleaned.startsWith('+');
    const digitsOnly = cleaned.replace(/\D/g, '');

    if (!digitsOnly) continue;

    let e164 = '';
    if (hasPlus) {
      e164 = '+' + digitsOnly;
    } else if (cleaned.startsWith('00')) {
      e164 = '+' + digitsOnly.slice(2);
    } else if (cleaned.startsWith('0')) {
      e164 = '+' + defaultCc + digitsOnly.slice(1);
    } else if (digitsOnly.length === 9) {
      e164 = '+' + defaultCc + digitsOnly;
    } else if (digitsOnly.startsWith(defaultCc) && digitsOnly.length >= 11) {
      e164 = '+' + digitsOnly;
    } else {
      e164 = '+' + (digitsOnly.startsWith(defaultCc) ? digitsOnly : defaultCc + digitsOnly);
    }

    const numDigits = e164.replace(/\D/g, '').length;
    if (numDigits >= 8 && numDigits <= 15) {
      return e164;
    }
  }

  return null;
}
