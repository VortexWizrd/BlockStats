import { db } from "../../db/index.js";
import { playerRankHistoryTable } from "../../db/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { Repository } from "../baserepository.js";

export class PlayerRankHistoriesRepository extends Repository {
  public static readonly table = playerRankHistoryTable;
  public static readonly row = this.table.$inferInsert;

  public static async getLatestRow(
    playerId: string,
    provider: string,
  ): Promise<typeof this.row | undefined> {
    const [row] = await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.provider, provider),
        ),
      )
      .orderBy(desc(this.table.timestamp))
      .limit(1);

    return row;
  }
}
