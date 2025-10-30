import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  retries: 0,
  // Use a non-interactive reporter to prevent hanging processes.
  reporter: [['list']],
  // Reuse the existing Next.js dev server on port 3000.
  use: {
    baseURL: 'http://localhost:3001',
    viewport: { width: 390, height: 844 },
    trace: 'on-first-retry',
    headless: true,
  },
  // Use a mobile profile so mobile-only UI (bottom nav) is visible.
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
