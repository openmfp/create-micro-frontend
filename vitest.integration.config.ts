import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    include: ["src/integration/**/*.integration.test.ts"],
    exclude: ["dist/**", "node_modules/**", "src/generators/**/templates/**"],
    testTimeout: 600000,
    hookTimeout: 600000,
    fileParallelism: false,
  },
});
