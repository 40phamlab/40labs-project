import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const workspaceMarker = path.join(repositoryRoot, 'pnpm-workspace.yaml');
const devDataDirectory = path.join(repositoryRoot, 'dev-data');
const databasePath = path.join(devDataDirectory, '40labs-dev.db');

if (!fs.existsSync(workspaceMarker) || path.dirname(databasePath) !== devDataDirectory) {
  console.error('[40Labs DB Reset] Refusing to reset: expected the repository development database.');
  process.exit(1);
}

const databaseFiles = [
  databasePath,
  `${databasePath}-wal`,
  `${databasePath}-shm`,
  `${databasePath}-journal`,
];

console.log('[40Labs DB Reset] Removing the local development database and SQLite sidecar files.');
console.log('[40Labs DB Reset] Close the desktop app first so it cannot recreate the database during reset.');

for (const filePath of databaseFiles) {
  if (!fs.existsSync(filePath)) continue;

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`[40Labs DB Reset] Failed to remove ${path.basename(filePath)}: ${error.message}`);
    process.exit(1);
  }

  if (fs.existsSync(filePath)) {
    console.error(`[40Labs DB Reset] File still exists after removal: ${path.basename(filePath)}`);
    process.exit(1);
  }

  console.log(`[40Labs DB Reset] Removed ${path.basename(filePath)}.`);
}

console.log('[40Labs DB Reset] Local development database cleared. The app will recreate it on next launch.');
