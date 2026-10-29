// Example slice: replace with real features.
// TEMPLATE-TODO(notes): replace the example notes slice with your own features
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../core/database.js";
import { notes } from "./schema.js";

export const notesService = {
  async create(ownerId: string, input: { title: string; body?: string }) {
    const [note] = await db
      .insert(notes)
      .values({
        ownerId,
        title: input.title,
        body: input.body ?? "",
      })
      .returning();
    return note;
  },

  async list(ownerId: string) {
    return db.select().from(notes).where(eq(notes.ownerId, ownerId)).orderBy(desc(notes.createdAt));
  },

  async get(id: number, ownerId: string) {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.ownerId, ownerId)));
    return note ?? null;
  },

  async update(id: number, ownerId: string, input: { title?: string; body?: string }) {
    const values: { title?: string; body?: string } = {};
    if (input.title !== undefined) values.title = input.title;
    if (input.body !== undefined) values.body = input.body;
    if (Object.keys(values).length === 0) return this.get(id, ownerId);

    const [updated] = await db
      .update(notes)
      .set(values)
      .where(and(eq(notes.id, id), eq(notes.ownerId, ownerId)))
      .returning();
    return updated ?? null;
  },

  async delete(id: number, ownerId: string) {
    const [deleted] = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.ownerId, ownerId)))
      .returning();
    return !!deleted;
  },
};
