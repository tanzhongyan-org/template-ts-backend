import type { Config } from "drizzle-kit";
import { config } from "./src/core/config";

export default {
  schema: "./src/domain/notes/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
} satisfies Config;
