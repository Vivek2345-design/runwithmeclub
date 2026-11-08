import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { globalSetup: ["./tests/global-setup.ts"], testTimeout: 30000, hookTimeout: 120000, include: ["src/**/*.test.ts"] },
});
