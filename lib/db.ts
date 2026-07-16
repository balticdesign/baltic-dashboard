import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

export function getSql() {
  const url = process.env.DATABASE_URL;
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
