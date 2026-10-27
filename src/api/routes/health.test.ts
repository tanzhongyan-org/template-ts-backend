import { describe, expect, it } from "vitest";
import { app } from "../../app.js";

describe("Health API", () => {
  it("returns status ok and valid json schema at /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("version");
    expect(Date.parse(body.timestamp)).not.toBeNaN();
  });

  it("serves valid OpenAPI specification at /doc", async () => {
    const res = await app.request("/doc");
    expect(res.status).toBe(200);

    const doc = await res.json();
    expect(doc.openapi).toBe("3.0.0");
    expect(doc.paths["/health"]).toBeDefined();
  });

  it("returns standard JSON 404 on unknown routes", async () => {
    const res = await app.request("/non-existent-route");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.status).toBe(404);
  });
});
