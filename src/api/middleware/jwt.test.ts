import { Hono } from "hono";
import type { JWTPayload } from "jose";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { IdentityEnv } from "./identity.js";
import { requireJwt } from "./jwt.js";

const ISSUER = "https://auth.example.test";
const AUDIENCE = "template-ts-backend";

type SignArgs = JWTPayload & { subject?: string | null; audience?: string | string[] };

describe("requireJwt", () => {
  let app: Hono<IdentityEnv>;
  let sign: (args?: SignArgs) => Promise<string>;
  let signWithIntruder: () => Promise<string>;

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair("ES256");
    const intruder = await generateKeyPair("ES256");
    const jwk = await exportJWK(publicKey);

    app = new Hono<IdentityEnv>()
      .use(
        requireJwt({
          getKey: createLocalJWKSet({ keys: [jwk] }),
          issuer: ISSUER,
          audience: AUDIENCE,
        }),
      )
      .get("/whoami", (c) => c.json({ ownerId: c.get("ownerId") }));

    sign = async ({ subject = "owner-jwt", audience = AUDIENCE, ...claims }: SignArgs = {}) => {
      const jwt = new SignJWT(claims)
        .setProtectedHeader({ alg: "ES256" })
        .setIssuer(ISSUER)
        .setAudience(audience);
      if (claims.exp === undefined) {
        jwt.setExpirationTime("5m");
      }
      if (subject !== null) {
        jwt.setSubject(subject);
      }
      return jwt.sign(privateKey);
    };
    signWithIntruder = () =>
      new SignJWT({})
        .setProtectedHeader({ alg: "ES256" })
        .setSubject("owner-intruder")
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime("5m")
        .sign(intruder.privateKey);
  });

  it("stores the token subject as ownerId when the token verifies", async () => {
    const res = await app.request("/whoami", {
      headers: { authorization: `Bearer ${await sign()}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ownerId: "owner-jwt" });
  });

  it("returns the 401 envelope when the token is missing, blank or not a Bearer token", async () => {
    for (const authorization of [undefined, "Bearer ", "Token abc.def.ghi"] as const) {
      const res = await app.request("/whoami", {
        headers: authorization ? { authorization } : {},
      });
      expect(res.status, String(authorization)).toBe(401);
      expect(await res.json()).toEqual({
        error: { message: "Authentication required", status: 401 },
      });
    }
  });

  it("returns 401 for an expired token, a wrong audience and a forged signature", async () => {
    const expired = await sign({ exp: Math.floor(Date.now() / 1000) - 60 });
    const wrongAudience = await sign({ audience: "another-app" });
    for (const token of [expired, wrongAudience, await signWithIntruder(), "not.a.token"]) {
      const res = await app.request("/whoami", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status, token.slice(0, 12)).toBe(401);
    }
  });

  it("returns 401 when the token has no subject", async () => {
    const res = await app.request("/whoami", {
      headers: { authorization: `Bearer ${await sign({ subject: null })}` },
    });
    expect(res.status).toBe(401);
  });

  it("throws a clear error when neither jwksUrl nor getKey is given", () => {
    expect(() => requireJwt({})).toThrow("requireJwt needs jwksUrl or getKey");
  });
});

describe("app JWT wiring", () => {
  it("guards /notes with JWT when jwt options are passed", async () => {
    const { publicKey, privateKey } = await generateKeyPair("ES256");
    const jwk = await exportJWK(publicKey);
    const app = createApp({
      jwt: {
        getKey: createLocalJWKSet({ keys: [jwk] }),
        issuer: ISSUER,
        audience: AUDIENCE,
      },
    });

    const anonymous = await app.request("/notes");
    expect(anonymous.status).toBe(401);

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256" })
      .setSubject("owner-jwt-notes")
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime("5m")
      .sign(privateKey);
    const listed = await app.request("/notes", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listed.status).toBe(200);
  });
});
