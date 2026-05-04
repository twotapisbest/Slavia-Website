import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke E2E bez logowania — pełne ścieżki SA wymagają konta testowego.
 * Uruchomienie: `pnpm exec playwright install` (raz).
 * Serwer: w osobnym terminalu `pnpm dev --host 127.0.0.1 --port 3000`, potem `pnpm run test:e2e`.
 * Opcjonalnie auto-start: ustaw PLAYWRIGHT_START_SERVER=1 (pierwsze uruchomienie może trwać kilka minut).
 */
export default defineConfig({
  testDir: 'e2e',
  workers: process.env.CI ? 2 : 1,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(process.env.PLAYWRIGHT_START_SERVER === '1'
    ? {
        webServer: {
          command: 'pnpm exec nuxt dev --host 127.0.0.1 --port 3000',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: true,
          timeout: 420_000
        }
      }
    : {})
})
