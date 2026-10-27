import { describe, expect, it } from "vitest";
import { app } from "../../index.js";
import { healthRouter } from "./health.js";

describe("Health API", () => {
  it("returns healthy status and metadata via healthRouter", async () => {
    const res = await healthRouter.request("/");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.version).toBe("0.1.0");
    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it("returns healthy status and metadata via app /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.version).toBe("0.1.0");
    expect(data.timestamp).toBeDefined();
  });

  it("serves valid OpenAPI specification at /doc", async () => {
    const res = await app.request("/doc");
    expect(res.status).toBe(200);

    const doc = await res.json();
    expect(doc.openapi).toBe("3.0.0");
    expect(doc.paths["/health"]).toBeDefined();
    expect(doc.paths["/health"].get).toBeDefined();
    expect(doc.components.schemas.HealthCheckResponse).toBeDefined();
  });

  it("serves interactive Scalar documentation at /reference", async () => {
    const res = await app.request("/reference");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });
});
