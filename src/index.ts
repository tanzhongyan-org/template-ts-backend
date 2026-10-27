import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { healthRouter } from "./api/routes/health.js";
import { config } from "./core/config.js";

export const app = new OpenAPIHono();

app.get("/", (c) => c.text(`Welcome to ${config.APP_NAME}`));
app.route("/health", healthRouter);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: config.APP_NAME,
    version: "0.1.0",
  },
});

app.get(
  "/reference",
  apiReference({
    spec: {
      url: "/doc",
    },
  }),
);

if (process.env.NODE_ENV !== "test") {
  serve(
    {
      fetch: app.fetch,
      port: config.PORT,
    },
    (info) => {
      console.log(`Server listening on http://localhost:${info.port}`);
    },
  );
}

export default app;
