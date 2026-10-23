import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const NAMESPACES = [
  'common',
  'nav',
  'settings',
  'auth',
  'dashboard',
  'sales',
  'inventory',
  'customers',
  'lab',
  'purchases',
  'reports',
  'notifications',
  'errors',
];

function flattenKeys(obj: any, prefix = ''): Record<string, string> {
  let keys: Record<string, string> = {};
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (obj[k] !== null && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      Object.assign(keys, flattenKeys(obj[k], fullKey));
    } else {
      keys[fullKey] = String(obj[k]);
    }
  }
  return keys;
}

function extractInterpolations(str: string): string[] {
  const matches = str.match(/\{\{([^}]+)\}\}/g);
  return matches ? matches.map((m) => m.trim()).sort() : [];
}

let hasErrors = false;

console.log('Running i18n structure and parity checks...');

for (const ns of NAMESPACES) {
  const swPath = path.join(LOCALES_DIR, 'sw', `${ns}.json`);
  const enPath = path.join(LOCALES_DIR, 'en', `${ns}.json`);

  if (!fs.existsSync(swPath)) {
    console.error(`[Error] Missing Swahili namespace file: ${swPath}`);
    hasErrors = true;
    continue;
  }
  if (!fs.existsSync(enPath)) {
    console.error(`[Error] Missing English namespace file: ${enPath}`);
    hasErrors = true;
    continue;
  }

  let swData, enData;
  try {
    swData = JSON.parse(fs.readFileSync(swPath, 'utf-8'));
  } catch (e) {
    console.error(`[Error] Invalid JSON in ${swPath}:`, e);
    hasErrors = true;
    continue;
  }
  try {
    enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  } catch (e) {
    console.error(`[Error] Invalid JSON in ${enPath}:`, e);
    hasErrors = true;
    continue;
  }

  const swFlat = flattenKeys(swData);
  const enFlat = flattenKeys(enData);

  const swKeys = Object.keys(swFlat);
  const enKeys = Object.keys(enFlat);

  // Check missing in EN
  for (const k of swKeys) {
    if (!(k in enFlat)) {
      console.error(`[Parity Error] Namespace "${ns}": Key "${k}" exists in sw but missing in en.`);
      hasErrors = true;
    } else {
      // Check empty values
      if (!swFlat[k] || swFlat[k].trim() === '') {
        console.error(`[Value Error] Namespace "${ns}": Key "${k}" has empty value in sw.`);
        hasErrors = true;
      }
      if (!enFlat[k] || enFlat[k].trim() === '') {
        console.error(`[Value Error] Namespace "${ns}": Key "${k}" has empty value in en.`);
        hasErrors = true;
      }
      // Check interpolation variables match
      const swVars = extractInterpolations(swFlat[k]);
      const enVars = extractInterpolations(enFlat[k]);
      if (swVars.join(',') !== enVars.join(',')) {
        console.error(`[Interpolation Error] Namespace "${ns}": Key "${k}" has mismatched variables (sw: [${swVars}], en: [${enVars}]).`);
        hasErrors = true;
      }
    }
  }

  // Check missing in SW
  for (const k of enKeys) {
    if (!(k in swFlat)) {
      console.error(`[Parity Error] Namespace "${ns}": Key "${k}" exists in en but missing in sw.`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error('\n❌ i18n checks failed with errors.');
  process.exit(1);
} else {
  console.log('✅ All i18n namespace parity, values, and interpolation checks passed successfully!');
  process.exit(0);
}
