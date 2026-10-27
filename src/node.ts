import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { config } from "./core/config.js";

const server = serve(
  {
    fetch: app.fetch,
    port: config.PORT,
    serverOptions: { headersTimeout: 10_000, requestTimeout: 30_000 },
  },
  (info) => {
    console.log(`[Node.js] Server listening on http://localhost:${info.port}`);
  },
);

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
