export function normalizePlace(s: string): string {
  if (!s) return '';
  const normalized = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const letters = normalized.replace(/[^a-zA-Z]/g, '');
  return letters.toUpperCase();
}

export function generateBranchCode(
  businessId: string,
  existingCodes: string[],
  district?: string | null,
  location?: string | null,
  now: Date = new Date()
): string {
  let maxSeq = 0;
  const reNew = /-B(\d+)-/;
  const reLegacy = /BR-(\d+)/;

  for (const code of existingCodes) {
    const matchNew = code.match(reNew);
    if (matchNew) {
      const seq = parseInt(matchNew[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    } else {
      const matchLegacy = code.match(reLegacy);
      if (matchLegacy) {
        const seq = parseInt(matchLegacy[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else {
        const seq = parseInt(code, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = nextSeq < 100 ? `B${String(nextSeq).padStart(2, '0')}` : `B${String(nextSeq).padStart(3, '0')}`;

  const cleanDistrict = district ? normalizePlace(district) : '';
  let place = 'XXX';
  if (cleanDistrict.length >= 3) {
    place = cleanDistrict.substring(0, 3);
  } else if (location) {
    const cleanLocation = normalizePlace(location);
    if (cleanLocation.length >= 3) {
      place = cleanLocation.substring(0, 3);
    }
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: '2-digit',
    month: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const yy = parts.find((p) => p.type === 'year')?.value || '26';
  const mm = parts.find((p) => p.type === 'month')?.value || '10';
  const yymm = `${yy}${mm}`;

  return `${businessId}-${seqStr}-${place}-${yymm}`;
}
