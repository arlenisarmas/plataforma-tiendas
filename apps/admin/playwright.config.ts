import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.pw.ts',
  ...(process.env.CI ? { workers: 1 } : {}),
  use: { baseURL: 'http://localhost:3001', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 800 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    { command: 'pnpm dev', url: 'http://localhost:3001/login', reuseExistingServer: !process.env.CI, timeout: 120_000 },
    { command: 'pnpm --filter @plataforma/storefront dev', url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
});
