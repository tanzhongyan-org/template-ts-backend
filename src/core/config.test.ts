import { describe, expect, it } from "vitest";
import { envSchema } from "./config.js";

describe("env guard", () => {
  it("fails boot when the dev identity flag is set in production", () => {
    expect(() =>
      envSchema.parse({ NODE_ENV: "production", TRUST_IDENTITY_HEADER: "true" }),
    ).toThrow(/TRUST_IDENTITY_HEADER must be false in production/);
  });

  it("allows the dev identity flag outside production", () => {
    for (const NODE_ENV of ["development", "test"] as const) {
      const env = envSchema.parse({ NODE_ENV, TRUST_IDENTITY_HEADER: "true" });
      expect(env.TRUST_IDENTITY_HEADER).toBe(true);
    }
  });

  it("allows production without the dev identity flag", () => {
    const env = envSchema.parse({ NODE_ENV: "production" });
    expect(env.TRUST_IDENTITY_HEADER).toBe(false);
  });
});
