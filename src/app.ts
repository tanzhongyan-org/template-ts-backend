import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { healthRouter } from "./api/routes/health.js";
import { notesRouter } from "./api/routes/notes.js";
import { config } from "./core/config.js";

export function createApp() {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              message: "Validation Error",
              details: result.error.issues,
            },
          },
          422,
        );
      }
      return undefined;
    },
  });

  // Root redirect to interactive API reference
  app.get("/", (c) => c.redirect("/reference", 302));

  // Feature routes
  app.route("/health", healthRouter);
  app.route("/notes", notesRouter);

  // OpenAPI Specification
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      title: config.APP_NAME,
      version: config.APP_VERSION,
    },
  });

  // Scalar Interactive Documentation
  app.get(
    "/reference",
    apiReference({
      spec: {
        url: "/doc",
      },
      pageTitle: `${config.APP_NAME} Reference`,
    }),
  );

  // Global Not Found handler (JSON)
  app.notFound((c) => {
    return c.json(
      {
        error: {
          message: "Route not found",
          status: 404,
        },
      },
      404,
    );
  });

  // Global Error handler (JSON)
  app.onError((err, c) => {
    return c.json(
      {
        error: {
          message: config.NODE_ENV === "production" ? "Internal Server Error" : err.message,
          status: 500,
        },
      },
      500,
    );
  });

  return app;
}

export const app = createApp();
export default app;
