import { describe, expect, it } from "vitest";
import { healthRouter } from "./health.js";

describe("GET /health", () => {
  it("returns healthy status and metadata", async () => {
    const res = await healthRouter.request("/");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.appName).toBe("template-ts-backend");
    expect(data.environment).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });
});
