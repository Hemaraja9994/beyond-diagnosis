import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

/** DATABASE_URL, or POSTGRES_URL as the Supabase integration on Vercel names it. */
const databaseUrl = (process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim()) ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;

export function storageMode(): "postgres" | "blob" | "local" {
  if (databaseUrl !== "") return "postgres";
  if ((process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "") !== "") return "blob";
  return "local";
}

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ ...connectionFor(databaseUrl), max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query<T>(text, params)).rows;
}

/**
 * Supabase needs an encrypted connection, but its certificate chain is not in Node's built-in list, and
 * `sslmode=require` in its URLs makes node-postgres insist on checking that chain. So for Supabase hosts the
 * URL's own SSL settings are dropped and the connection is encrypted without checking the chain.
 * Keep in step with scripts/migrate.mjs.
 */
function connectionFor(url: string): pg.PoolConfig {
  if (!/supabase\.(com|co)\b/i.test(url)) return { connectionString: url };
  const parsed = new URL(url);
  for (const key of ["sslmode", "sslrootcert", "supa", "pgbouncer"]) parsed.searchParams.delete(key);
  return { connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } };
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => [])).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}
