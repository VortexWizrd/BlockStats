import { eq, sql } from "drizzle-orm";
import { mapsTable } from "../../db/schema.js";
import { Repository } from "../baserepository.js";
import { db } from "../../db/index.js";

export class MapsRepository extends Repository {
  public static readonly table = mapsTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "id", value: id }]);
  }

  public static async findByBeatSaverId(
    id: string,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "beatSaverId", value: id }]);
  }

  public static async findByHash(
    hash: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "hash", value: hash }]);
  }

  public static async addLeaderboardId(
    id: number,
    leaderboardId: number,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        leaderboardIds: sql`array_append(${this.table.leaderboardIds}, ${leaderboardId})`,
      })
      .where(eq(this.table.id, id));
  }
}
