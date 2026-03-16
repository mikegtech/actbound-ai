import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export const defineSharedVitestConfig = () => {
  return defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
      globals: true,
      environment: "node",
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov", "json-summary", "html", "junit"],
        reportsDirectory: "./coverage",
        thresholds: {
          lines: 10,
          functions: 10,
          branches: 5,
          statements: 10,
          autoUpdate: false,
        },
      },
    },
  });
};
