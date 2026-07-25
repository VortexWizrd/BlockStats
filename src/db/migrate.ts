import { migrate } from "drizzle-orm/node-postgres/migrator";
import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "./index.js";
import dotenv from "dotenv";
import { scoresTable } from "./schema.js";
import { and, eq, ne, notInArray, sql } from "drizzle-orm";
dotenv.config();

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

export async function setOutdatedScores(): Promise<void> {
  const selectedScores = db
    .select({
      latestId: sql<number>`MAX(${scoresTable.id})`.as("latest_id"),
    })
    .from(scoresTable)
    .groupBy(
      scoresTable.playerId,
      scoresTable.songHash,
      scoresTable.songDifficulty,
      scoresTable.songCharacteristic,
    );

  await db
    .update(scoresTable)
    .set({ outdated: true })
    .where(
      and(
        eq(scoresTable.outdated, false),
        notInArray(scoresTable.id, selectedScores),
      ),
    );
}
