import { db } from "../db/index.js";
import { playersTable, scoresTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

type ScoreRow = typeof scoresTable.$inferInsert;
export class ScoresRepository {
  public static async findById(id: number): Promise<ScoreRow | undefined> {
    const [row] = await db
      .select()
      .from(scoresTable)
      .where(eq(scoresTable.id, id));
    return row;
  }

  public static async findByBeatLeaderId(
    id: number,
  ): Promise<ScoreRow | undefined> {
    const [row] = await db
      .select()
      .from(scoresTable)
      .where(eq(scoresTable.blLeaderboardId, id));
    return row;
  }

  public static async insert(row: ScoreRow): Promise<ScoreRow | undefined> {
    const [score] = await db
      .insert(scoresTable)
      .values(row)
      .onConflictDoNothing({
        target: scoresTable.id,
      })
      .returning();
    return score;
  }
}
