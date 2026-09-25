const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', 'dist', '.git', 'build'].includes(entry.name)) {
        getFiles(full, files);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

const imports = new Map();
const root = path.resolve('C:/Users/User/OneDrive/Desktop/40Labs');

getFiles(root).forEach(file => {
  if (file.includes(path.join('packages', 'ui-components'))) return;
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@40labs\/ui-components['"]/g);
  if (matches) {
    matches.forEach(m => {
      const match = m.match(/import\s+\{([^}]+)\}\s+from/);
      if (match) {
        match[1].split(',').map(s => s.trim()).filter(Boolean).forEach(spec => {
          const name = spec.split(' as ')[0].trim();
          if (!imports.has(name)) imports.set(name, []);
          imports.get(name).push(path.relative(root, file));
        });
      }
    });
  }
});

console.log('=== USAGES OF @40labs/ui-components EXPORTS ===');
Array.from(imports.entries()).sort().forEach(([comp, files]) => {
  console.log(`${comp} (${files.length}):`);
  files.forEach(f => console.log('  -', f));
});
