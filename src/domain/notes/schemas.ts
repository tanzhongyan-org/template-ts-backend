import { z } from "@hono/zod-openapi";

// Postgres text columns reject NUL characters, so reject them at the boundary.
const NO_NUL = new RegExp(`^[^${String.fromCharCode(0)}]*$`);
const titleText = () => z.string().min(1).max(200).regex(NO_NUL);
const bodyText = () => z.string().regex(NO_NUL);

export const NoteSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    ownerId: z.string().openapi({ example: "user-123" }),
    title: titleText().openapi({ example: "Meeting notes" }),
    body: bodyText().openapi({ example: "Discuss project roadmap." }),
    createdAt: z.string().datetime().openapi({ example: "2026-10-27T12:00:00Z" }),
    updatedAt: z.string().datetime().nullable().openapi({ example: "2026-10-27T12:00:00Z" }),
  })
  .openapi("Note");

export const CreateNoteSchema = z
  .object({
    title: titleText().openapi({ example: "Meeting notes" }),
    body: bodyText().default("").openapi({ example: "Discuss project roadmap." }),
  })
  .openapi("CreateNote");

export const UpdateNoteSchema = z
  .object({
    title: titleText().optional().openapi({ example: "Updated title" }),
    body: bodyText().optional().openapi({ example: "Updated body" }),
  })
  .openapi("UpdateNote");

export const NoteParamsSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .max(2_147_483_647)
    .openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
});
