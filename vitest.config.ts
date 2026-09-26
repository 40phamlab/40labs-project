import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react-dom/client': path.resolve(__dirname, 'node_modules/react-dom/client.js'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom/index.js'),
      react: path.resolve(__dirname, 'node_modules/react/index.js'),
      '@40labs/ui-components': path.resolve(__dirname, 'packages/ui-components/src/index.ts'),
      '@40labs/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
      '@40labs/design-tokens': path.resolve(__dirname, 'packages/design-tokens/src/index.ts'),
    },
  },
});
