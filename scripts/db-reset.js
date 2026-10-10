import fs from 'fs';
import path from 'path';

const devDbPath = path.resolve(process.cwd(), 'dev-data', '40labs-dev.db');

if (!devDbPath.replace(/\\/g, '/').endsWith('dev-data/40labs-dev.db')) {
  console.error('[40Labs DB Reset] ERROR: Refusing to reset database. Path does not point to dev-data/40labs-dev.db:', devDbPath);
  process.exit(1);
}

console.log('[40Labs DB Reset] Resetting development database at:', devDbPath);

const files = [
  devDbPath,
  devDbPath + '-wal',
  devDbPath + '-shm'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log('[40Labs DB Reset] Deleted:', file);
    } catch (err) {
      console.error('[40Labs DB Reset] Failed to delete:', file, err);
    }
  }
}

console.log('[40Labs DB Reset] Database reset complete.');
