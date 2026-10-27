import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { healthRouter } from "./api/routes/health.js";
import { config } from "./core/config.js";

const app = new Hono();

app.get("/", (c) => c.text(`Welcome to ${config.APP_NAME}`));
app.route("/health", healthRouter);

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
