import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Note } from "../../domain/notes/schema.js";
import {
  CreateNoteSchema,
  NoteParamsSchema,
  NoteSchema,
  UpdateNoteSchema,
} from "../../domain/notes/schemas.js";
import { notesService } from "../../domain/notes/service.js";

export const notesRouter = new OpenAPIHono();

// Identity stub: reads x-user-id header with a test fallback.
// Single swap point for real auth / session verification.
function getOwnerId(headerValue?: string): string {
  return headerValue ?? "test-owner";
}

const listNotesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Notes"],
  summary: "List all notes belonging to authenticated owner",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(NoteSchema) } },
      description: "List of owner's notes",
    },
  },
});

const createNoteRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Notes"],
  summary: "Create a note for authenticated owner",
  request: {
    body: { content: { "application/json": { schema: CreateNoteSchema } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: NoteSchema } },
      description: "Note created successfully",
    },
  },
});

const getNoteRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Notes"],
  summary: "Get note by ID (filtered by owner)",
  request: { params: NoteParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: NoteSchema } },
      description: "Note found",
    },
    404: { description: "Note not found" },
  },
});

const updateNoteRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["Notes"],
  summary: "Update note by ID (filtered by owner)",
  request: {
    params: NoteParamsSchema,
    body: { content: { "application/json": { schema: UpdateNoteSchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: NoteSchema } },
      description: "Note updated",
    },
    404: { description: "Note not found" },
  },
});

const deleteNoteRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["Notes"],
  summary: "Delete note by ID (filtered by owner)",
  request: { params: NoteParamsSchema },
  responses: {
    204: { description: "Note deleted successfully" },
    404: { description: "Note not found" },
  },
});

notesRouter.openapi(listNotesRoute, async (c) => {
  const ownerId = getOwnerId(c.req.header("x-user-id"));
  const list = await notesService.list(ownerId);
  return c.json(
    list.map((n: Note) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt ? n.updatedAt.toISOString() : null,
    })),
    200,
  );
});

notesRouter.openapi(createNoteRoute, async (c) => {
  const ownerId = getOwnerId(c.req.header("x-user-id"));
  const body = c.req.valid("json");
  const note = await notesService.create(ownerId, body);
  return c.json(
    {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt ? note.updatedAt.toISOString() : null,
    },
    201,
  );
});

notesRouter.openapi(getNoteRoute, async (c) => {
  const ownerId = getOwnerId(c.req.header("x-user-id"));
  const { id } = c.req.valid("param");
  const note = await notesService.get(id, ownerId);
  if (!note) {
    return c.json({ error: { message: "Note not found", status: 404 } }, 404);
  }
  return c.json(
    {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt ? note.updatedAt.toISOString() : null,
    },
    200,
  );
});

notesRouter.openapi(updateNoteRoute, async (c) => {
  const ownerId = getOwnerId(c.req.header("x-user-id"));
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const updated = await notesService.update(id, ownerId, body);
  if (!updated) {
    return c.json({ error: { message: "Note not found", status: 404 } }, 404);
  }
  return c.json(
    {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : null,
    },
    200,
  );
});

notesRouter.openapi(deleteNoteRoute, async (c) => {
  const ownerId = getOwnerId(c.req.header("x-user-id"));
  const { id } = c.req.valid("param");
  const deleted = await notesService.delete(id, ownerId);
  if (!deleted) {
    return c.json({ error: { message: "Note not found", status: 404 } }, 404);
  }
  return c.body(null, 204);
});
