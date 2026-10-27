import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { healthCheckResponseSchema } from "../../domain/health/schemas.js";
import { getHealth } from "../../domain/health/service.js";

export const healthRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  summary: "Service health check",
  description: "Returns operational status, timestamp, and version metadata.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: healthCheckResponseSchema,
        },
      },
      description: "Service is healthy and operational",
    },
  },
});

export const healthRouter = new OpenAPIHono().openapi(healthRoute, (c) => {
  const health = getHealth();
  return c.json(health, 200);
});
