import { defineConfig, devices } from "@playwright/test";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv") as typeof import("dotenv");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs") as typeof import("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path") as typeof import("path");

/**
 * Determine the target environment and load the corresponding .env file.
 *
 *   TEST_ENV=staging npx playwright test      → loads playwright/.env.staging
 *   TEST_ENV=production npx playwright test   → loads playwright/.env.production
 *
 * Defaults to 'staging' if TEST_ENV is not set.
 */
const VALID_ENVS = ["staging", "production"] as const;
type ValidEnv = (typeof VALID_ENVS)[number];

const testEnvRaw = process.env.TEST_ENV || "staging";
if (!(VALID_ENVS as readonly string[]).includes(testEnvRaw)) {
  throw new Error(
    `Invalid TEST_ENV: '${testEnvRaw}'. Expected one of: ${VALID_ENVS.join(", ")}`,
  );
}
const testEnv: ValidEnv = testEnvRaw as ValidEnv;
const envFile = path.resolve(__dirname, "playwright", `.env.${testEnv}`);

if (!fs.existsSync(envFile)) {
  const message =
    `Environment file not found: ${envFile}\n` +
    `TEST_ENV is '${testEnv}' (default: 'staging'). Ensure playwright/.env.${testEnv} exists.\n` +
    `Copy playwright/.env.staging.example to playwright/.env.${testEnv} and fill in credentials.`;

  if (process.env.CI) {
    throw new Error(message);
  }
  console.warn(`⚠️  ${message}`);
}

dotenv.config({ path: envFile });

// Shared Chromium launch args used by both the desktop and mobile Chrome projects.
// Keeping them in one place reduces the maintenance surface when flags need to change.
const CHROME_ARGS = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-web-security",
  "--disable-features=VizDisplayCompositor",
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
];

export default defineConfig({
  testDir: "./playwright/tests",

  // Per-test timeout. Login + ad creation + market verification should complete in
  // 2–3 minutes under normal staging conditions; 120000 gives headroom for slow staging
  // while failing fast. With CI retries: 1, this still allows two full attempts before
  // a test is marked failed — a 10-minute timeout delays CI failure feedback excessively.
  timeout: 120000,

  expect: {
    timeout: 45000,
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 1 : 0,

  workers: process.env.CI ? 5 : undefined,

  reporter: [
    ["list"],
    ["html", { outputFolder: "./playwright/playwright-report" }],
    ["json", { outputFile: "./playwright/playwright-report/results.json" }],
    ...(process.env.TESTDINO_TOKEN ?
      [["@testdino/playwright", { token: process.env.TESTDINO_TOKEN, serverUrl: "https://reporter.testdino.com" }] as [string, object]] : []),
  ],

  use: {
    baseURL: process.env.BASE_URL || "https://staging-dp2p.deriv.com/",

    headless: !!process.env.CI,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    navigationTimeout: 45000,
    actionTimeout: 45000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 864 },
        userAgent: `${devices["Desktop Chrome"].userAgent} Playwright-Agent/deriv/1.9`,
        launchOptions: {
          args: CHROME_ARGS,
        },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 412, height: 915 },
        userAgent: `${devices["Pixel 7"].userAgent} Playwright-Agent/deriv/1.9`,
        launchOptions: {
          args: CHROME_ARGS,
        },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1536, height: 864 },
        userAgent: `${devices["Desktop Firefox"].userAgent} Playwright-Agent/deriv/1.9`,
        permissions: ["geolocation"],
        launchOptions: {
          firefoxUserPrefs: {
            "media.navigator.streams.fake": true,
            "media.navigator.permission.disabled": true,
          },
        },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1536, height: 864 },
        userAgent: `${devices["Desktop Safari"].userAgent} Playwright-Agent/deriv/1.9`,
        permissions: ["geolocation"],
      },
    },
    {
      name: "webkit-mobile",
      use: {
        ...devices["iPhone 15 Plus"],
        userAgent: `${devices["iPhone 15 Plus"].userAgent} Playwright-Agent/deriv/1.9`,
        permissions: ["geolocation"],
      },
    },
  ],

  outputDir: "./playwright/test-results",

  webServer:
    process.env.START_SERVER === "true"
      ? {
        command: process.env.SERVER_COMMAND || "pnpm dev",
        url: process.env.SERVER_URL || "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      }
      : undefined,
});
