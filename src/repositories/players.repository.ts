import type { RankTimestamp } from "../common/player.js";
import { db } from "../db/index.js";
import { playersTable } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { Repository } from "./baserepository.js";

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
    ranktimestamp: RankTimestamp,
  ): Promise<typeof this.row | undefined> {
    const [player] = await db
      .update(playersTable)
      .set({
        blRankHistory: sql`COALESCE(${playersTable.blRankHistory}, '[]::jsonb') || ${JSON.stringify([ranktimestamp])}::jsonb`,
      })
      .where(eq(playersTable.id, id))
      .returning();
    return player;
  }
}
