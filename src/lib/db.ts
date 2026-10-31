import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Minimal slice of the Cloudflare D1 binding API used by this app. */
export type D1Result<T> = { results: T[] };
export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
};
export type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
};

let dbOverride: { db: D1Database | null } | undefined;

/** Unit tests pin the D1 binding. Production leaves this unset. */
export function setTestDb(db: D1Database | null): void {
  dbOverride = { db };
}

/**
 * Cloudflare D1 binding `DB` (see wrangler.jsonc). Returns null when the app
 * runs outside a Worker without bindings (e.g. plain `next build`), so pages
 * fall back to the static seed content instead of crashing.
 */
export async function getDb(): Promise<D1Database | null> {
  if (dbOverride) return dbOverride.db;
  try {
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as { DB?: D1Database }).DB) ?? null;
  } catch {
    return null;
  }
}

export async function requireDb(): Promise<D1Database> {
  const db = await getDb();
  if (!db) throw new Error("D1 binding DB is not available");
  return db;
}

/** ISO-8601 UTC timestamp, same format stored by the Neon -> D1 import. */
export function nowIso() {
  return new Date().toISOString();
}
