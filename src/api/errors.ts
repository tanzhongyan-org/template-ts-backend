import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Shape of every error body the API returns. */
export const ErrorEnvelopeSchema = z
  .object({
    error: z.object({
      message: z.string().openapi({ example: "Note not found" }),
      status: z.number().int().openapi({ example: 404 }),
      details: z.array(z.unknown()).optional(),
    }),
  })
  .openapi("ErrorEnvelope");

type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/** OpenAPI response entry for an error status; reuse it in every route's `responses`. */
export function errorResponse(description: string) {
  return {
    content: { "application/json": { schema: ErrorEnvelopeSchema } },
    description,
  };
}

/** Writes the shared error envelope. All error responses go through here. */
export function respondError<S extends ContentfulStatusCode>(
  c: Context,
  status: S,
  message: string,
  details?: unknown[],
) {
  const body: ErrorEnvelope = { error: { message, status, ...(details ? { details } : {}) } };
  return c.json(body, status);
}
