import readXlsxFile from 'read-excel-file';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const parseLine = (line: string): string[] => {
    const row: string[] = [];
    let inQuote = false;
    let currentVal = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === delimiter && !inQuote) {
        row.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    row.push(currentVal.trim().replace(/^"|"$/g, ''));
    return row;
  };

  const rawHeaderCols = parseLine(lines[0]);
  const headers = rawHeaderCols.filter((h) => h.length > 0);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length && i <= 5000; i++) {
    const cols = parseLine(lines[i]);
    if (cols.every((c) => c === '')) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await file.text();
    return parseCsvText(text);
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const rawData = await readXlsxFile(file);
    if (rawData.length === 0) return { headers: [], rows: [] };
    const headers = rawData[0].map(String).filter((h) => h.trim().length > 0);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < rawData.length && i <= 5000; i++) {
      const cols = rawData[i].map((v) => (v !== null && v !== undefined ? String(v).trim() : ''));
      if (cols.every((c) => c === '')) continue;
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
      });
      rows.push(rowObj);
    }
    return { headers, rows };
  } else {
    throw new Error('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
  }
}
