import type { RankTimestamp } from "../../common/player.js";
import { db } from "../../db/index.js";
import { playersTable } from "../../db/schema.js";
import { eq, sql, desc, isNotNull, asc, and, ne, or } from "drizzle-orm";
import { Repository } from "../baserepository.js";

export class PlayersRepository extends Repository {
  public static readonly table = playersTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "id", value: id }]);
  }

  public static async findByAllIds(
    id: string,
  ): Promise<typeof this.row | undefined> {
    const [row] = await db
      .select()
      .from(this.table)
      .where(
        or(
          eq(this.table.id, id),
          eq(this.table.steamId, id),
          eq(
            this.table.questId,
            isNaN(parseInt(id)) ? (parseInt(id) ?? -1) : -1,
          ),
          eq(this.table.alias, id),
          eq(this.table.beatLeaderId, id),
          eq(this.table.scoreSaberId, id),
          eq(this.table.scoreSaberAlias, id),
          eq(this.table.accSaberId, id),
        ),
      );

    return row;
  }

  public static async getAll(): Promise<(typeof this.row)[] | undefined> {
    return await this.find([]);
  }

  public static async findBySteamId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "steamId", value: id }]);
  }

  public static async findByOculusId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "oculusId", value: id }]);
  }

  public static async findByQuestId(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "questId", value: id }]);
  }

  public static async findByScoreSaberId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "scoreSaberId", value: id }]);
  }

  public static async updateBLRank(
    id: string,
    rank: number,
  ): Promise<typeof this.row | undefined> {
    const [player] = await db
      .update(playersTable)
      .set({ blRank: rank })
      .where(eq(playersTable.id, id))
      .returning();
    return player;
  }

  public static async updateSSRank(
    id: string,
    rank: number,
  ): Promise<typeof this.row | undefined> {
    const [player] = await db
      .update(playersTable)
      .set({ ssRank: rank })
      .where(eq(playersTable.id, id))
      .returning();
    return player;
  }

  public static async updateBLPP(
    id: string,
    pp: number,
  ): Promise<typeof this.row | undefined> {
    if (pp <= 0) return undefined;
    const [player] = await db
      .update(playersTable)
      .set({ blPP: pp })
      .where(eq(playersTable.id, id))
      .returning();
    return player;
  }

  public static async updateSSPP(
    id: string,
    pp: number,
  ): Promise<typeof this.row | undefined> {
    if (pp <= 0) return undefined;
    const [player] = await db
      .update(playersTable)
      .set({ ssPP: pp })
      .where(eq(playersTable.id, id))
      .returning();
    return player;
  }

  public static async updateASRank(
    id: string,
    rank: number,
    type: "Tech Acc" | "True Acc" | "Standard Acc" | "Overall",
  ): Promise<typeof this.row | undefined> {
    switch (type) {
      case "Tech Acc": {
        const [player] = await db
          .update(playersTable)
          .set({ asTechRank: rank })
          .where(eq(playersTable.id, id))
          .returning();
        return player;
      }

      case "True Acc": {
        const [player] = await db
          .update(playersTable)
          .set({ asTrueRank: rank })
          .where(eq(playersTable.id, id))
          .returning();
        return player;
      }

      case "Standard Acc": {
        const [player] = await db
          .update(playersTable)
          .set({ asStandardRank: rank })
          .where(eq(playersTable.id, id))
          .returning();
        return player;
      }

      case "Overall": {
        const [player] = await db
          .update(playersTable)
          .set({ asRank: rank })
          .where(eq(playersTable.id, id))
          .returning();
        return player;
      }
    }
  }

  public static async getTopBL(
    limit: number,
    offset: number,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .where(and(isNotNull(this.table.blRank), ne(this.table.blRank, 0)))
      .orderBy(asc(this.table.blRank))
      .limit(limit)
      .offset(offset);
  }

  public static async getTopSS(
    limit: number,
    offset: number,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .where(and(isNotNull(this.table.ssRank), ne(this.table.ssRank, 0)))
      .orderBy(asc(this.table.ssRank))
      .limit(limit)
      .offset(offset);
  }
}
