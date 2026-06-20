import { migrate } from "drizzle-orm/node-postgres/migrator";
import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "./index.js";

function resolveMigrationsFolder(): string {
  const fromCwd = path.resolve(process.cwd(), "drizzle");
  console.log(fromCwd);
  if (existsSync(path.join(fromCwd, "meta", "_journal.json"))) {
    return fromCwd;
  }
  return path.join(import.meta.dirname, "..", "..", "drizzle");
}

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: resolveMigrationsFolder() }).catch(
    (error) => {
      throw error;
    },
  );
}
