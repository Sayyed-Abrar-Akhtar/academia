import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import { seed } from "./seed";

const globalForDb = globalThis as unknown as {
  dbClient?: PGlite;
  seedPromise?: Promise<void>;
};

if (!globalForDb.dbClient) {
  globalForDb.dbClient = new PGlite();
}

export const client = globalForDb.dbClient;
export const db = drizzle(client, { schema });

export async function ensureDbSeeded() {
  if (!globalForDb.seedPromise) {
    globalForDb.seedPromise = seed();
  }
  await globalForDb.seedPromise;
}
