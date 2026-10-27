import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Note } from "../../domain/notes/schema.js";
import {
  CreateNoteSchema,
  NoteParamsSchema,
  NoteSchema,
  UpdateNoteSchema,
} from "../../domain/notes/schemas.js";
import { notesService } from "../../domain/notes/service.js";
import { errorResponse, respondError } from "../errors.js";
import type { IdentityEnv } from "../middleware/identity.js";

export const notesRouter = new OpenAPIHono<IdentityEnv>();

const unauthorized = errorResponse("Missing or untrusted caller identity");
const notFound = errorResponse("Note not found");
const malformed = errorResponse("Request body is not valid JSON");
const invalid = errorResponse("Request failed validation");
const unsupported = errorResponse("Content-Type is not application/json");
const tooLarge = errorResponse("Request body exceeds the size limit");

function toNoteResponse(note: Note) {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt ? note.updatedAt.toISOString() : null,
  };
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
    401: unauthorized,
  },
});

const createNoteRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Notes"],
  summary: "Create a note for authenticated owner",
  request: {
    body: { content: { "application/json": { schema: CreateNoteSchema } }, required: true },
  },
  responses: {
    201: {
      content: { "application/json": { schema: NoteSchema } },
      description: "Note created successfully",
    },
    400: malformed,
    401: unauthorized,
    413: tooLarge,
    415: unsupported,
    422: invalid,
  },
});

const getNoteRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Notes"],
  summary: "Get note by ID (filtered by owner)",
  request: { params: NoteParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: NoteSchema } },
      description: "Note found",
    },
    401: unauthorized,
    404: notFound,
    422: invalid,
  },
});

const updateNoteRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Notes"],
  summary: "Update note by ID (filtered by owner)",
  request: {
    params: NoteParamsSchema,
    body: { content: { "application/json": { schema: UpdateNoteSchema } }, required: true },
  },
  responses: {
    200: {
      content: { "application/json": { schema: NoteSchema } },
      description: "Note updated",
    },
    400: malformed,
    401: unauthorized,
    404: notFound,
    413: tooLarge,
    415: unsupported,
    422: invalid,
  },
});

const deleteNoteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Notes"],
  summary: "Delete note by ID (filtered by owner)",
  request: { params: NoteParamsSchema },
  responses: {
    204: { description: "Note deleted successfully" },
    401: unauthorized,
    404: notFound,
    422: invalid,
  },
});

notesRouter.openapi(listNotesRoute, async (c) => {
  const list = await notesService.list(c.get("ownerId"));
  return c.json(list.map(toNoteResponse), 200);
});

notesRouter.openapi(createNoteRoute, async (c) => {
  const note = await notesService.create(c.get("ownerId"), c.req.valid("json"));
  return c.json(toNoteResponse(note), 201);
});

notesRouter.openapi(getNoteRoute, async (c) => {
  const { id } = c.req.valid("param");
  const note = await notesService.get(id, c.get("ownerId"));
  if (!note) return respondError(c, 404, "Note not found");
  return c.json(toNoteResponse(note), 200);
});

notesRouter.openapi(updateNoteRoute, async (c) => {
  const { id } = c.req.valid("param");
  const updated = await notesService.update(id, c.get("ownerId"), c.req.valid("json"));
  if (!updated) return respondError(c, 404, "Note not found");
  return c.json(toNoteResponse(updated), 200);
});

notesRouter.openapi(deleteNoteRoute, async (c) => {
  const { id } = c.req.valid("param");
  const deleted = await notesService.delete(id, c.get("ownerId"));
  if (!deleted) return respondError(c, 404, "Note not found");
  return c.body(null, 204);
});
