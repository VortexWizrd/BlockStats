import type { RankTimestamp } from "../../common/player.js";
import { db } from "../../db/index.js";
import { playersTable } from "../../db/schema.js";
import { eq, sql, desc, isNotNull, asc, and, ne } from "drizzle-orm";
import { Repository } from "../baserepository.js";

export class PlayersRepository extends Repository {
  public static readonly table = playersTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "id", value: id }]);
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
