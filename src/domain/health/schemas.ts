import { z } from "@hono/zod-openapi";

export const healthCheckResponseSchema = z
  .object({
    status: z.literal("ok").openapi({
      example: "ok",
      description: "Service health status indicator",
    }),
    timestamp: z.string().datetime().openapi({
      example: "2026-10-27T12:00:00.000Z",
      description: "Current server ISO timestamp",
    }),
    version: z.string().openapi({
      example: "0.1.0",
      description: "Application semantic version",
    }),
  })
  .openapi("HealthCheckResponse");

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
