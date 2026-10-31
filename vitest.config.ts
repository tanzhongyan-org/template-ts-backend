import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, ".worktrees/**"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["**/*.test.*", "**/*.d.ts"],
      thresholds: { lines: 90, branches: 82, functions: 87, statements: 88 },
    },
    env: { TRUST_IDENTITY_HEADER: "true" },
  },
});
