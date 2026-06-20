import { db } from "../db/index.js";
import { playersTable, scoresTable, type ScoreRow } from "../db/schema.js";
import { eq } from "drizzle-orm";

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

  public static async insert(row: ScoreRow): Promise<void> {
    await db.insert(scoresTable).values(row).onConflictDoNothing({
      target: scoresTable.id,
    });
  }
}
