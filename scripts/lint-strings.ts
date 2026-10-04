import * as fs from 'fs';
import * as path from 'path';

interface AllowListEntry {
  file: string;
  string: string;
  reason: string;
}

interface LintIssue {
  file: string;
  line: number;
  string: string;
  type: 'i18n-parity' | 'forbidden-string' | 'invalid-comment';
  message: string;
  allowListed?: boolean;
  allowListReason?: string;
}

const ROOT_DIR = process.cwd();
const ALLOW_LIST_PATH = path.join(ROOT_DIR, 'scripts', 'lint-strings.allow.json');

// Load allow-list
let allowList: AllowListEntry[] = [];
if (fs.existsSync(ALLOW_LIST_PATH)) {
  try {
    allowList = JSON.parse(fs.readFileSync(ALLOW_LIST_PATH, 'utf-8'));
  } catch (err) {
    console.error('Error parsing lint-strings.allow.json:', err);
    process.exit(1);
  }
}

// Ensure every entry in allow list has a non-empty reason
for (const entry of allowList) {
  if (!entry.reason || !entry.reason.trim()) {
    console.error(`[Lint Error] Allow-list entry for file "${entry.file}" and string "${entry.string}" lacks a valid reason.`);
    process.exit(1);
  }
}

function isAllowListed(filePath: string, text: string): { isAllowed: boolean; reason?: string } {
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  for (const entry of allowList) {
    const entryFile = entry.file.replace(/\\/g, '/');
    if (relativePath.includes(entryFile) || entryFile.includes(relativePath)) {
      if (text.toLowerCase().includes(entry.string.toLowerCase())) {
        return { isAllowed: true, reason: entry.reason };
      }
    }
  }
  return { isAllowed: false };
}

function getFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === 'dist' || file === '.next' || file === 'build' || file === '.artifacts' || file === '_archive') {
      continue;
    }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file) && !file.endsWith('.d.ts') && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const issues: LintIssue[] = [];

// 1. i18n Parity Check
async function checkI18nParity() {
  const i18nIndexPath = path.join(ROOT_DIR, 'packages', 'i18n', 'src', 'index.ts');
  if (!fs.existsSync(i18nIndexPath)) return;

  const content = fs.readFileSync(i18nIndexPath, 'utf-8');

  // Extract sw-TZ / sw block and en block
  const swMatch = content.match(/sw(?:-TZ)?\s*:\s*\{([\s\S]*?)\}\s*,\s*en\s*:/);
  const enMatch = content.match(/en\s*:\s*\{([\s\S]*?)\}\s*,?\s*\}\s*;/);

  if (swMatch && enMatch) {
    const parseKeys = (block: string) => {
      const map = new Map<string, string>();
      const lines = block.split('\n');
      for (const line of lines) {
        const lineMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"]/);
        if (lineMatch) {
          map.set(lineMatch[1], lineMatch[2]);
        }
      }
      return map;
    };

    const swKeys = parseKeys(swMatch[1]);
    const enKeys = parseKeys(enMatch[1]);

    // Check parity
    for (const [key, val] of swKeys) {
      if (!enKeys.has(key)) {
        issues.push({
          file: 'packages/i18n/src/index.ts',
          line: 1,
          string: key,
          type: 'i18n-parity',
          message: `i18n key "${key}" exists in sw-TZ but missing in en locale`,
        });
      }
      if (val === key) {
        issues.push({
          file: 'packages/i18n/src/index.ts',
          line: 1,
          string: key,
          type: 'i18n-parity',
          message: `i18n value for key "${key}" in sw-TZ is identical to its key name`,
        });
      }
    }

    for (const [key, val] of enKeys) {
      if (!swKeys.has(key)) {
        issues.push({
          file: 'packages/i18n/src/index.ts',
          line: 1,
          string: key,
          type: 'i18n-parity',
          message: `i18n key "${key}" exists in en but missing in sw-TZ locale`,
        });
      }
      if (val === key) {
        issues.push({
          file: 'packages/i18n/src/index.ts',
          line: 1,
          string: key,
          type: 'i18n-parity',
          message: `i18n value for key "${key}" in en is identical to its key name`,
        });
      }
    }
  }
}

// User-visible forbidden phrases regex
const USER_VISIBLE_FORBIDDEN_REGEX = /(coming\s+soon|stubbed?|lorem\s+ipsum|lorem|wip|not\s+implemented|test\s+data|['"]placeholder['"]|['"]enter\s+placeholder['"])/i;

const VALID_TODO_REGEX = /TODO:\s*\[[^\]]+\]\s*\[[^\]]+\]/i;

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 1. Check TODO / FIXME comment format
    const commentMatch = line.match(/(\/\/|\/\*)\s*(TODO|FIXME)(.*)/i);
    if (commentMatch) {
      if (!VALID_TODO_REGEX.test(line)) {
        const allowCheck = isAllowListed(filePath, line.trim());
        issues.push({
          file: filePath,
          line: lineNum,
          string: line.trim(),
          type: 'invalid-comment',
          message: `Comment uses bare TODO/FIXME. Must follow "TODO: [reason] [phase]" format.`,
          allowListed: allowCheck.isAllowed,
          allowListReason: allowCheck.reason,
        });
      }
    }

    // 2. Check forbidden user-visible text in JSX text, string props, or i18n values
    const isCommentLine = /^\s*(\/\/|\/\*|\*)/.test(line);
    const isConsoleLine = /console\.(log|warn|error)/.test(line);

    if (!isCommentLine && !isConsoleLine) {
      const match = line.match(USER_VISIBLE_FORBIDDEN_REGEX);
      if (match) {
        const matchedText = match[0];
        const allowCheck = isAllowListed(filePath, line.trim());
        issues.push({
          file: filePath,
          line: lineNum,
          string: line.trim(),
          type: 'forbidden-string',
          message: `User-visible text contains forbidden placeholder phrase "${matchedText}".`,
          allowListed: allowCheck.isAllowed,
          allowListReason: allowCheck.reason,
        });
      }

      // Check bare TODO/FIXME in user-visible JSX content
      if (/(>|\s)(TODO|FIXME)\b/.test(line) && !VALID_TODO_REGEX.test(line)) {
        const allowCheck = isAllowListed(filePath, line.trim());
        issues.push({
          file: filePath,
          line: lineNum,
          string: line.trim(),
          type: 'forbidden-string',
          message: `User-visible JSX contains "TODO" or "FIXME" text.`,
          allowListed: allowCheck.isAllowed,
          allowListReason: allowCheck.reason,
        });
      }
    }
  }
}

async function run() {
  await checkI18nParity();

  const appFiles = getFiles(path.join(ROOT_DIR, 'apps'));
  const pkgFiles = getFiles(path.join(ROOT_DIR, 'packages'));

  const allFiles = [...appFiles, ...pkgFiles];
  for (const file of allFiles) {
    scanFile(file);
  }

  // Filter issues
  const errorIssues = issues.filter((i) => !i.allowListed);
  const allowedIssues = issues.filter((i) => i.allowListed);

  console.log('\n======================================================');
  console.log('            PRE-AUTH STRING AUDIT REPORT              ');
  console.log('======================================================\n');

  if (allowedIssues.length > 0) {
    console.log(`[ALLOW-LISTED FINDINGS] (${allowedIssues.length}):`);
    for (const issue of allowedIssues) {
      const relPath = path.relative(ROOT_DIR, issue.file);
      console.log(`  - [ALLOWED] ${relPath}:${issue.line} -> "${issue.string}" (${issue.allowListReason})`);
    }
    console.log('');
  }

  if (errorIssues.length > 0) {
    console.error(`[AUDIT FAILURES] Found ${errorIssues.length} issue(s) that need fixing:\n`);
    for (const issue of errorIssues) {
      const relPath = path.relative(ROOT_DIR, issue.file);
      console.error(`  ❌ ${relPath}:${issue.line} [${issue.type}]`);
      console.error(`     Message: ${issue.message}`);
      console.error(`     Snippet: ${issue.string}\n`);
    }
    process.exit(1);
  } else {
    console.log(`✅ All string and comment checks PASSED successfully! (${issues.length} checked, ${allowedIssues.length} allow-listed)\n`);
    process.exit(0);
  }
}

run();
