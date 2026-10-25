import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
  },
  webServer: {
    command: 'pnpm web -c',
    port: 8081,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
