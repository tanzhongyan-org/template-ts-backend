import { describe, expect, it } from "vitest";
import { app } from "../../app.js";

describe("Notes API Integration", () => {
  it("create -> get round-trip works for owner", async () => {
    const createRes = await app.request("/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "owner-1",
      },
      body: JSON.stringify({
        title: "Test Note",
        body: "Test note body content",
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Test Note");
    expect(created.body).toBe("Test note body content");

    const getRes = await app.request(`/notes/${created.id}`, {
      headers: { "x-user-id": "owner-1" },
    });
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe("Test Note");
    expect(fetched.body).toBe("Test note body content");
  });

  it("rejects invalid input (empty title or >200 chars)", async () => {
    // Empty title
    const resEmpty = await app.request("/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "owner-validation",
      },
      body: JSON.stringify({
        title: "",
        body: "empty",
      }),
    });
    expect(resEmpty.status).toBe(422);

    // Title too long
    const resTooLong = await app.request("/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "owner-validation",
      },
      body: JSON.stringify({
        title: "a".repeat(201),
        body: "too long",
      }),
    });
    expect(resTooLong.status).toBe(422);
  });

  it("enforces tenant isolation: owner A cannot read, update, or delete owner B's note", async () => {
    const resA = await app.request("/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "owner-alice",
      },
      body: JSON.stringify({
        title: "Alice Private Note",
        body: "Secret info",
      }),
    });
    expect(resA.status).toBe(201);
    const noteA = await resA.json();

    // Bob cannot read Alice's note
    const getByBob = await app.request(`/notes/${noteA.id}`, {
      headers: { "x-user-id": "owner-bob" },
    });
    expect(getByBob.status).toBe(404);

    // Bob cannot update Alice's note
    const patchByBob = await app.request(`/notes/${noteA.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "owner-bob",
      },
      body: JSON.stringify({ title: "Tampered by Bob" }),
    });
    expect(patchByBob.status).toBe(404);

    // Bob cannot delete Alice's note
    const deleteByBob = await app.request(`/notes/${noteA.id}`, {
      method: "DELETE",
      headers: { "x-user-id": "owner-bob" },
    });
    expect(deleteByBob.status).toBe(404);

    // Alice can delete her note
    const deleteByAlice = await app.request(`/notes/${noteA.id}`, {
      method: "DELETE",
      headers: { "x-user-id": "owner-alice" },
    });
    expect(deleteByAlice.status).toBe(204);

    // After deletion, Alice cannot read it either
    const getDeleted = await app.request(`/notes/${noteA.id}`, {
      headers: { "x-user-id": "owner-alice" },
    });
    expect(getDeleted.status).toBe(404);
  });
});
