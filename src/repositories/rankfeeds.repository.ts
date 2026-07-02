import { db } from "../db/index.js";
import { rankFeedsTable } from "../db/schema.js";
import { Repository } from "./baserepository.js";
import { arrayContains, eq, sql } from "drizzle-orm";

export class RankFeedsRepository extends Repository {
  public static readonly table = rankFeedsTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "id", value: id }]);
  }

  public static async findByChannelId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "channelId", value: id }]);
  }

  public static async findByUserId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "userId", value: id }]);
  }

  public static async findManyByGlobalType(): Promise<
    (typeof this.row)[] | undefined
  > {
    return await this.find([{ name: "type", value: "global" }]);
  }

  public static async findConnected(
    id: string,
  ): Promise<(typeof this.row)[] | undefined> {
    return await db
      .select()
      .from(this.table)
      .where(arrayContains(this.table.playerIds, [id]));
  }

  public static async findManyByBlockStatsGlobalType(): Promise<
    (typeof this.row)[] | undefined
  > {
    return await this.find([{ name: "type", value: "blockstats_global" }]);
  }

  public static async appendPlayerId(
    id: number,
    playerId: string,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        playerIds: sql`array_append(${this.table.playerIds}, ${playerId})`,
      })
      .where(eq(this.table.id, id));
  }

  public static async removePlayerId(
    id: number,
    playerId: string,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        playerIds: sql`array_remove(${this.table.playerIds}, ${playerId})`,
      })
      .where(eq(this.table.id, id));
  }

  public static async replaceIds(oldId: string, newId: string) {
    await db.update(this.table).set({
      playerIds: sql`array_replace(${this.table.playerIds}, ${oldId}, ${newId})`,
    });
  }
}
