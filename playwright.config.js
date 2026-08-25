// @ts-check
const { defineConfig, devices } = require('@playwright/test')
const { BASE_URL, API_URL } = require('./utils/env')

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Blob reports in CI so sharded runs can be merged into a single HTML report.
  reporter: process.env.CI
    ? [['list'], ['blob']]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    // The Toolshop app uses data-test instead of the default data-testid.
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Logs in once and saves storageState for authenticated specs.
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'chromium',
      testMatch: 'tests/ui/**/*.spec.js',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: 'tests/ui/**/*.spec.js',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: 'tests/ui/**/*.spec.js',
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile smoke pass: only @smoke-tagged UI tests under Pixel emulation.
    {
      name: 'mobile-chrome',
      testMatch: 'tests/ui/**/*.spec.js',
      grep: /@smoke/,
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'] },
    },

    // Pure API tests: no browser, request contexts against the backend.
    {
      name: 'api',
      testMatch: 'tests/api/**/*.spec.js',
      use: { baseURL: API_URL },
    },
  ],
})
