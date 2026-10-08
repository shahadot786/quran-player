import { readdir, readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set; run with: node --env-file=.env.local scripts/migrate.mts");

const sql = neon(url);
const directory = new URL("./sql/", import.meta.url);

for (const file of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
  const statements = (await readFile(new URL(file, directory), "utf8")).split(/;\s*\n/).map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  console.log(`applied ${file} (${statements.length} statements)`);
}
