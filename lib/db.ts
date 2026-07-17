import postgres from "postgres";

// Supports either a manually-set DATABASE_URL, or Vercel's native Supabase
// storage integration, which injects prefixed vars (DATABASE_POSTGRES_URL /
// DATABASE_POSTGRES_PRISMA_URL) that stay in sync automatically if the DB
// password is ever rotated. Prefer the pooled variants (pgbouncer, port 6543)
// since this runs in serverless functions.
function resolveConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_PRISMA_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    undefined
  );
}

let sql: ReturnType<typeof postgres> | null = null;

export function getSql() {
  const url = resolveConnectionString();
  if (!url) {
    throw new Error("MISSING_DATABASE_URL");
  }
  if (!sql) {
    sql = postgres(url, {
      ssl: "require",
      prepare: false,
    });
  }
  return sql;
}
