import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.pw.ts',
  use: { baseURL: 'http://127.0.0.1:3001', ...devices['Desktop Chrome'] },
  webServer: { command: 'pnpm dev', url: 'http://127.0.0.1:3001/login', reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
