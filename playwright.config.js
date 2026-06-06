import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:8787",
    headless: true
  },
  webServer: {
    command: "npm.cmd start",
    url: "http://localhost:8787/health",
    reuseExistingServer: true,
    timeout: 60_000
  }
});
