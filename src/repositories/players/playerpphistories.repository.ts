import { db } from "../../db/index.js";
import {
  playerPPHistoryTable,
  playerRankHistoryTable,
} from "../../db/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { Repository } from "../baserepository.js";
import type { ProviderType } from "../../common/provider.js";

export class PlayerPPHistoriesRepository extends Repository {
  public static readonly table = playerPPHistoryTable;
  public static readonly row = this.table.$inferInsert;

  public static async getLatestRow(
    playerId: string,
    provider: ProviderType,
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

  public static async getLatestRows(
    playerId: string,
    provider: ProviderType,
    limit: number,
  ): Promise<(typeof this.row)[] | undefined> {
    const rows = await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.provider, provider),
        ),
      )
      .orderBy(desc(this.table.timestamp))
      .limit(limit);

    return rows;
  }
}
