import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SRC_DIR = path.join(__dirname, '../../../apps/core-desktop/src');

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
  'landing',
  'instructions',
  'connectivity',
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

function getSourceFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === 'dist' || file === 'build') continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getSourceFiles(filePath, fileList);
    } else if (/\.(ts|tsx)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

let hasErrors = false;

console.log('Running i18n structure, parity, and source usage checks...');

// 1. Load and flatten locales
const swFlatMap: Record<string, string> = {};
const enFlatMap: Record<string, string> = {};

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

  const swFlat = flattenKeys(swData, ns);
  const enFlat = flattenKeys(enData, ns);

  for (const [k, v] of Object.entries(swFlat)) {
    swFlatMap[k] = v;
  }
  for (const [k, v] of Object.entries(enFlat)) {
    enFlatMap[k] = v;
  }

  // Parity checks between sw and en
  for (const k of Object.keys(swFlat)) {
    if (!(k in enFlat)) {
      console.error(`[Parity Error] Namespace "${ns}": Key "${k}" exists in sw but missing in en.`);
      hasErrors = true;
    } else {
      if (!swFlat[k] || swFlat[k].trim() === '') {
        console.error(`[Value Error] Namespace "${ns}": Key "${k}" has empty value in sw.`);
        hasErrors = true;
      }
      if (!enFlat[k] || enFlat[k].trim() === '') {
        console.error(`[Value Error] Namespace "${ns}": Key "${k}" has empty value in en.`);
        hasErrors = true;
      }
      const swVars = extractInterpolations(swFlat[k]);
      const enVars = extractInterpolations(enFlat[k]);
      if (swVars.join(',') !== enVars.join(',')) {
        console.error(`[Interpolation Error] Namespace "${ns}": Key "${k}" has mismatched variables.`);
        hasErrors = true;
      }
    }
  }

  for (const k of Object.keys(enFlat)) {
    if (!(k in swFlat)) {
      console.error(`[Parity Error] Namespace "${ns}": Key "${k}" exists in en but missing in sw.`);
      hasErrors = true;
    }
  }
}

// 2. Scan source code for core shell translation keys (nav.*, connectivity.*, settings.*)
const sourceFiles = getSourceFiles(SRC_DIR);
const usedKeys = new Set<string>();

const tRegex = /\bt\(\s*['"]([^'"]+)['"]/g;
const labelKeyRegex = /labelKey\s*:\s*['"]([^'"]+)['"]/g;

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const k = match[1];
    if (k.startsWith('nav.') || k.startsWith('connectivity.') || k.startsWith('settings.')) {
      usedKeys.add(k);
    }
  }
  while ((match = labelKeyRegex.exec(content)) !== null) {
    const k = match[1];
    if (k.startsWith('nav.') || k.startsWith('connectivity.') || k.startsWith('settings.')) {
      usedKeys.add(k);
    }
  }
}

for (const key of usedKeys) {
  if (!(key in swFlatMap) || !(key in enFlatMap)) {
    console.error(`[Usage Error] Core key "${key}" used in source code is missing from localization dictionaries.`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ i18n checks failed with errors.');
  process.exit(1);
} else {
  console.log(`✅ All i18n parity, values, interpolation, and core source usage checks (${usedKeys.size} core keys verified) passed successfully!`);
  process.exit(0);
}
