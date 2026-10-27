import { app } from "./app.js";
import { config } from "./core/config.js";

console.log(`[Bun] Server listening on http://localhost:${config.PORT}`);
console.log(`[Scalar Docs] http://localhost:${config.PORT}/reference`);

export default {
  port: config.PORT,
  maxRequestBodySize: config.MAX_BODY_BYTES,
  idleTimeout: 10,
  fetch: app.fetch,
};
