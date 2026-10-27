import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { TRUST_IDENTITY_HEADER: "true" },
  },
});
