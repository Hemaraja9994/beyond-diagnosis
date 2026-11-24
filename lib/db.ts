import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;

export function storageMode(): "postgres" | "blob" | "local" {
  if (databaseUrl !== "") return "postgres";
  if ((process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "") !== "") return "blob";
  return "local";
}

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5, ssl: hostedSsl(databaseUrl) });
    return (await pool.query(text, params)).rows as T[];
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query<T>(text, params)).rows;
}

/**
 * Supabase (and similar hosts) need an encrypted connection, but their certificate chain is not in Node's
 * built-in list, so the connection is encrypted without checking the chain. A URL that sets its own
 * sslmode keeps that choice.
 */
function hostedSsl(url: string): pg.PoolConfig["ssl"] {
  if (/[?&]sslmode=/i.test(url)) return undefined;
  return /supabase\.(com|co)\b/i.test(url) ? { rejectUnauthorized: false } : undefined;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => [])).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}
