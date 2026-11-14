import { defineConfig, devices } from "@playwright/test";

const basePath = process.env.BASE_PATH ?? "/chat-dashboard-hub/";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  outputDir: "test-results/pages-security",
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:8081${basePath}`, trace: "retain-on-failure" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 8081 --strictPort",
    url: `http://127.0.0.1:8081${basePath}`,
    env: { BASE_PATH: basePath },
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) } }],
});
