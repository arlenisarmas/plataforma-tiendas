import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.pw.ts',
  ...(process.env.CI ? { workers: 1 } : {}),
  use: { baseURL: 'http://localhost:3001', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    // Fail fast with a clear message instead of waiting for the whole test timeout.
    actionTimeout: 20_000, navigationTimeout: 60_000 },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 800 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    { command: 'pnpm dev', url: 'http://localhost:3001/login', reuseExistingServer: !process.env.CI, timeout: 300_000 },
    // The bare host has no store (404); readiness needs a page that answers 2xx.
    { command: 'pnpm --filter @plataforma/storefront dev', url: 'http://localhost:3000/?tienda=chepeludos',
      reuseExistingServer: !process.env.CI, timeout: 300_000 },
  ],
});
