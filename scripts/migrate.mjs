import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

// DATABASE_URL, or POSTGRES_URL as the Supabase integration on Vercel names it (see lib/db.ts).
const url = (process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim()) ?? "";
const files = (await readdir("migrations").catch(() => [])).filter((file) => file.endsWith(".sql")).sort();

if (url === "" || files.length === 0) {
  console.log("migrate: nothing to do");
  process.exit(0);
}

const target = process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.POSTGRES_URL_NON_POOLING?.trim() || url;

// Same as connectionFor in lib/db.ts: Supabase is encrypted, without checking its certificate chain.
function connectionFor(value) {
  if (!/supabase\.(com|co)\b/i.test(value)) return { connectionString: value };
  const parsed = new URL(value);
  for (const key of ["sslmode", "sslrootcert", "supa", "pgbouncer"]) parsed.searchParams.delete(key);
  return { connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } };
}

const client = new pg.Client(connectionFor(target));
await client.connect();

try {
  await client.query("set lock_timeout = '60s'");
  await client.query("select pg_advisory_lock(7272741)");
  await client.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set((await client.query("select name from schema_migrations")).rows.map((row) => row.name));
  for (const file of files.filter((name) => !done.has(name))) {
    await client.query("begin");
    try {
      await client.query(await readFile(`migrations/${file}`, "utf8"));
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`migrate: applied ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
