import { z } from "@hono/zod-openapi";

export const NoteSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    ownerId: z.string().openapi({ example: "user-123" }),
    title: z.string().min(1).max(200).openapi({ example: "Meeting notes" }),
    body: z.string().openapi({ example: "Discuss project roadmap." }),
    createdAt: z.string().datetime().openapi({ example: "2026-10-27T12:00:00Z" }),
    updatedAt: z.string().datetime().nullable().openapi({ example: "2026-10-27T12:00:00Z" }),
  })
  .openapi("Note");

export const CreateNoteSchema = z
  .object({
    title: z.string().min(1).max(200).openapi({ example: "Meeting notes" }),
    body: z.string().default("").openapi({ example: "Discuss project roadmap." }),
  })
  .openapi("CreateNote");

export const UpdateNoteSchema = z
  .object({
    title: z.string().min(1).max(200).optional().openapi({ example: "Updated title" }),
    body: z.string().optional().openapi({ example: "Updated body" }),
  })
  .openapi("UpdateNote");

export const NoteParamsSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
});
