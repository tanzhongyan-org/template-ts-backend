import { z } from "zod";

const booleanFlag = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default("template-ts-backend"),
  APP_VERSION: z.string().default("0.1.0"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/template_ts_backend"),
  // Honours the x-user-id header as the caller identity. Leave false until real
  // authentication replaces the header stub (see src/api/middleware/identity.ts).
  TRUST_IDENTITY_HEADER: booleanFlag,
  // Largest accepted request body in bytes; larger bodies get a 413 response.
  MAX_BODY_BYTES: z.coerce.number().int().positive().default(1_048_576),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const config: EnvConfig = envSchema.parse(process.env);
