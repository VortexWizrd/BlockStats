import { db } from "../../db/index.js";
import { playerRankHistoryTable } from "../../db/schema.js";
import { eq, desc, and, gte, lte, asc } from "drizzle-orm";
import { Repository } from "../baserepository.js";
import type { ProviderType } from "../../common/provider.js";

export class PlayerRankHistoriesRepository extends Repository {
  public static readonly table = playerRankHistoryTable;
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

  public static async getOldestRow(
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
      .orderBy(asc(this.table.timestamp))
      .limit(1);

    return row;
  }

  public static async getFromRange(
    playerId: string,
    provider:
      | "BeatLeader"
      | "ScoreSaber"
      | "AccSaber"
      | "AccSaber (Tech Acc)"
      | "AccSaber (True Acc)"
      | "AccSaber (Standard Acc)",
    lowerTimeMs: number,
    upperTimeMs: number,
  ): Promise<(typeof this.row)[] | undefined> {
    const upperBound = new Date(upperTimeMs);
    const lowerBound = new Date(lowerTimeMs);

    const rows = await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.provider, provider),
          gte(this.table.timestamp, lowerBound),
          lte(this.table.timestamp, upperBound),
        ),
      )
      .orderBy(desc(this.table.timestamp));

    return rows;
  }

  public static async getPlayersRankBeforeCutoff(
    provider: ProviderType,
    cutoff: Date,
    limit: number,
    offset: number,
  ): Promise<(typeof this.row)[] | undefined> {
    const rows = await db
      .selectDistinctOn([this.table.playerId])
      .from(this.table)
      .where(
        and(
          lte(this.table.timestamp, cutoff),
          eq(this.table.provider, provider),
        ),
      )
      .orderBy(this.table.playerId, desc(this.table.timestamp))
      .limit(limit)
      .offset(offset);

    return rows;
  }
}
