import { createMiddleware } from "hono/factory";
import type { JWTVerifyGetKey } from "jose";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { respondError } from "../errors.js";
import { type IdentityEnv, MAX_OWNER_ID_LENGTH } from "./identity.js";

export type JwtOptions = {
  /** JWKS endpoint of the product's auth server. Either this or `getKey` is required. */
  jwksUrl?: string;
  issuer?: string;
  audience?: string;
  /** Test seam: pass `createLocalJWKSet` instead of fetching a remote JWKS. */
  getKey?: JWTVerifyGetKey;
};

/**
 * Validates a Bearer JWT against the product's JWKS and stores `sub` as `ownerId`.
 * Fails closed: a missing, invalid or expired token gets a 401.
 *
 * TEMPLATE-TODO(auth): point JWKS_URL at the product's auth server (Better Auth jwt plugin)
 */
export function requireJwt(options: JwtOptions) {
  if (!options.getKey && !options.jwksUrl) {
    throw new Error("requireJwt needs jwksUrl or getKey");
  }
  const getKey = options.getKey ?? createRemoteJWKSet(new URL(options.jwksUrl ?? ""));
  return createMiddleware<IdentityEnv>(async (c, next) => {
    const header = c.req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : undefined;
    if (!token) {
      return respondError(c, 401, "Authentication required");
    }
    try {
      const { payload } = await jwtVerify(token, getKey, {
        issuer: options.issuer,
        audience: options.audience,
      });
      if (
        typeof payload.sub !== "string" ||
        payload.sub.length === 0 ||
        payload.sub.length > MAX_OWNER_ID_LENGTH
      ) {
        return respondError(c, 401, "Authentication required");
      }
      c.set("ownerId", payload.sub);
      return next();
    } catch {
      return respondError(c, 401, "Authentication required");
    }
  });
}
