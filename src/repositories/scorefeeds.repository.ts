import { db } from "../db/index.js";
import { scoreFeedsTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

type ScoreFeedRow = typeof scoreFeedsTable.$inferInsert;
export class ScoreFeedsRepository {
  public static async findById(id: number): Promise<ScoreFeedRow | undefined> {
    const [row] = await db
      .select()
      .from(scoreFeedsTable)
      .where(eq(scoreFeedsTable.id, id));
    return row;
  }

  public static async findByUserId(
    id: string,
  ): Promise<ScoreFeedRow | undefined> {
    const [row] = await db
      .select()
      .from(scoreFeedsTable)
      .where(eq(scoreFeedsTable.channelId, id));
    return row;
  }

  public static async findByChannelId(
    id: string,
  ): Promise<ScoreFeedRow | undefined> {
    const [row] = await db
      .select()
      .from(scoreFeedsTable)
      .where(eq(scoreFeedsTable.userId, id));
    return row;
  }

  public static async findManyByGlobalType(): Promise<ScoreFeedRow[]> {
    const rows = await db
      .select()
      .from(scoreFeedsTable)
      .where(eq(scoreFeedsTable.type, "global"));
    return rows;
  }

  public static async insert(
    row: ScoreFeedRow,
  ): Promise<ScoreFeedRow | undefined> {
    const [scoreFeed] = await db
      .insert(scoreFeedsTable)
      .values(row)
      .onConflictDoNothing({
        target: scoreFeedsTable.id,
      })
      .returning();
    return scoreFeed;
  }
}
