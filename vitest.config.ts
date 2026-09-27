import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    deps: {
      inline: ['@40labs/ui-components'],
    },
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
    },
  },
});
