import { createMiddleware } from "hono/factory";
import { respondError } from "../errors.js";

/**
 * Rejects requests that do not declare a JSON body, including empty ones.
 * Register it on the exact method and path of each route that takes a body.
 */
export const requireJsonBody = createMiddleware(async (c, next) => {
  const contentType = c.req.header("content-type") ?? "";
  if (!/^application\/(.+\+)?json\b/i.test(contentType)) {
    return respondError(c, 415, "Content-Type must be application/json");
  }
  return next();
});
