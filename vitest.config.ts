import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const testingLibraryPath = require.resolve('@testing-library/react');
const reactDomPath = path.dirname(require.resolve('react-dom/package.json', { paths: [testingLibraryPath] }));
const reactPath = path.dirname(require.resolve('react/package.json', { paths: [testingLibraryPath] }));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'tests/**/*.test.{ts,tsx}',
      'apps/**/*.test.{ts,tsx}',
      'packages/**/*.test.{ts,tsx}',
    ],
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@testing-library/react'],
    alias: {
      '@40labs/ui-components': path.resolve(__dirname, 'packages/ui-components/src/index.ts'),
      '@40labs/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
      '@40labs/design-tokens': path.resolve(__dirname, 'packages/design-tokens/src/index.ts'),
      'react/jsx-dev-runtime': path.join(reactPath, 'jsx-dev-runtime.js'),
      'react/jsx-runtime': path.join(reactPath, 'jsx-runtime.js'),
      'react-dom/client': path.join(reactDomPath, 'client.js'),
      'react-dom': reactDomPath,
      'react': reactPath,
    },
  },
});
