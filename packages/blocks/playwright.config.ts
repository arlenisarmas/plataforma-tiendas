import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './visual',
  testMatch: '*.pw.tsx',
  use: { browserName: 'chromium', viewport: { width: 360, height: 800 } },
});
