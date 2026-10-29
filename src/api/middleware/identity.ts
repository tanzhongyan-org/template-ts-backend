import { createMiddleware } from "hono/factory";
import { respondError } from "../errors.js";

export type IdentityEnv = { Variables: { ownerId: string } };

// matches notes.owner_id varchar(256)
export const MAX_OWNER_ID_LENGTH = 256;

/**
 * Resolves the caller and stores it as `ownerId`.
 * Fails closed: without a trusted, non-blank identity the request gets a 401.
 *
 * TEMPLATE-TODO(auth): replace header identity with real authentication
 */
export function requireIdentity(options: { trustHeader: boolean }) {
  return createMiddleware<IdentityEnv>(async (c, next) => {
    const header = options.trustHeader ? c.req.header("x-user-id")?.trim() : undefined;
    if (!header || header.length > MAX_OWNER_ID_LENGTH) {
      return respondError(c, 401, "Authentication required");
    }
    c.set("ownerId", header);
    return next();
  });
}
