import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default("template-ts-backend"),
  APP_VERSION: z.string().default("0.1.0"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const config: EnvConfig = envSchema.parse(process.env);
