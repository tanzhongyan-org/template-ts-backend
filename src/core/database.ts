import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as notesSchema from "../domain/notes/schema.js";
import { config } from "./config.js";

export const client = postgres(config.DATABASE_URL);
export const db = drizzle(client, { schema: { ...notesSchema } });
