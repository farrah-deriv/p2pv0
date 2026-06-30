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

export default defineConfig({
  testDir: "./playwright/tests",

  timeout: 600000,

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
  ],

  use: {
    baseURL: process.env.BASE_URL || "https://staging-dp2p.deriv.com/",

    headless: !!process.env.CI,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    launchOptions: {
      slowMo: 0,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    },

    navigationTimeout: 45000,
    actionTimeout: 45000,

    userAgent: "Playwright-Agent/deriv/1.9",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 864 },
        userAgent: "Playwright-Agent/deriv/1.9",
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 412, height: 915 },
        // userAgent: `${devices["Pixel 7"].userAgent} Playwright-Agent/deriv/1.9`,
        userAgent: 'Playwright-Agent/deriv/1.9',
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
