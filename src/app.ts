import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { respondError } from "./api/errors.js";
import { requireIdentity } from "./api/middleware/identity.js";
import { requireJsonBody } from "./api/middleware/json-body.js";
import { type JwtOptions, requireJwt } from "./api/middleware/jwt.js";
import { healthRouter } from "./api/routes/health.js";
import { notesRouter } from "./api/routes/notes.js";
import { allowedMethods } from "./api/routing.js";
import { config } from "./core/config.js";

export type AppOptions = {
  trustIdentityHeader?: boolean;
  maxBodyBytes?: number;
  /** When set, protected routes validate Bearer JWTs instead of trusting the header. */
  jwt?: JwtOptions;
};

export function createApp(options: AppOptions = {}) {
  const trustHeader = options.trustIdentityHeader ?? config.TRUST_IDENTITY_HEADER;
  const maxBodyBytes = options.maxBodyBytes ?? config.MAX_BODY_BYTES;
  const jwtOptions =
    options.jwt ??
    (config.JWKS_URL
      ? { jwksUrl: config.JWKS_URL, issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE }
      : undefined);

  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return respondError(c, 422, "Validation Error", result.error.issues);
      }
      return undefined;
    },
  });

  app.use(
    "*",
    bodyLimit({
      maxSize: maxBodyBytes,
      onError: (c) => respondError(c, 413, "Request body too large"),
    }),
  );
  app.use("/notes/*", jwtOptions ? requireJwt(jwtOptions) : requireIdentity({ trustHeader }));
  app.post("/notes", requireJsonBody);
  app.patch("/notes/:id", requireJsonBody);

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

  app.notFound((c) => {
    const allowed = allowedMethods(app.routes, c.req.path);
    if (allowed.length > 0) {
      c.header("Allow", allowed.join(", "));
      return respondError(c, 405, "Method not allowed");
    }
    return respondError(c, 404, "Route not found");
  });

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return respondError(c, err.status, err.message);
    }
    console.error(err);
    return respondError(c, 500, "Internal Server Error");
  });

  return app;
}

export const app = createApp();
export default app;
