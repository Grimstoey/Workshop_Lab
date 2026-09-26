import { defineConfig } from '@playwright/test';

// End-to-end tests treat the app as a black box: it runs in its own
// container (docker compose "app" service) and we only talk HTTP to it.
export default defineConfig({
  testDir: './e2e',
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
  },
});
