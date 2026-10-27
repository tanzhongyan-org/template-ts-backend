import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

const json = { "Content-Type": "application/json" };

describe("Notes API security boundary", () => {
  const app = createApp({ trustIdentityHeader: true, maxBodyBytes: 1024 });

  it("returns 401 with the error envelope when x-user-id is missing", async () => {
    const res = await app.request("/notes");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { message: "Authentication required", status: 401 },
    });
  });

  it("returns 401 when x-user-id is blank", async () => {
    const res = await app.request("/notes", { headers: { "x-user-id": "   " } });
    expect(res.status).toBe(401);
  });

  it("returns 401 for every notes method without identity", async () => {
    for (const [method, path] of [
      ["POST", "/notes"],
      ["GET", "/notes/1"],
      ["PATCH", "/notes/1"],
      ["DELETE", "/notes/1"],
    ] as const) {
      const res = await app.request(path, {
        method,
        headers: json,
        body: method === "POST" ? "{}" : undefined,
      });
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it("returns 401 when the header is present but TRUST_IDENTITY_HEADER is false", async () => {
    const untrusting = createApp({ trustIdentityHeader: false });
    const res = await untrusting.request("/notes", { headers: { "x-user-id": "owner-1" } });
    expect(res.status).toBe(401);
  });

  it("keeps public routes open without identity", async () => {
    const untrusting = createApp({ trustIdentityHeader: false });
    expect((await untrusting.request("/health")).status).toBe(200);
    expect((await untrusting.request("/doc")).status).toBe(200);
  });

  it("returns 413 with the error envelope when the body exceeds the limit", async () => {
    const res = await app.request("/notes", {
      method: "POST",
      headers: { ...json, "x-user-id": "owner-limit" },
      body: JSON.stringify({ title: "big", body: "x".repeat(2048) }),
    });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: { message: "Request body too large", status: 413 } });
  });

  it("returns a 400 envelope for malformed JSON instead of a 500", async () => {
    const res = await app.request("/notes", {
      method: "POST",
      headers: { ...json, "x-user-id": "owner-json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.status).toBe(400);
  });

  it("returns a 422 envelope for an out-of-range note id", async () => {
    const res = await app.request("/notes/99999999999", { headers: { "x-user-id": "owner-id" } });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.status).toBe(422);
  });

  it("returns 404 when another owner reads a note", async () => {
    const created = await app.request("/notes", {
      method: "POST",
      headers: { ...json, "x-user-id": "owner-a" },
      body: JSON.stringify({ title: "private" }),
    });
    const note = await created.json();
    const res = await app.request(`/notes/${note.id}`, { headers: { "x-user-id": "owner-b" } });
    expect(res.status).toBe(404);
  });

  it("returns 415 when a write request does not declare JSON", async () => {
    const res = await app.request("/notes", {
      method: "POST",
      headers: { "x-user-id": "owner-ct" },
      body: "title=x",
    });
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.error.status).toBe(415);
  });

  it("returns 405 with an Allow header for a method the route does not serve", async () => {
    const res = await app.request("/notes", {
      method: "PUT",
      headers: { "x-user-id": "owner-405" },
    });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, POST");
  });

  it("rejects NUL characters in note text with 422", async () => {
    const res = await app.request("/notes", {
      method: "POST",
      headers: { ...json, "x-user-id": "owner-nul" },
      body: JSON.stringify({ title: "bad\u0000title" }),
    });
    expect(res.status).toBe(422);
  });
});
