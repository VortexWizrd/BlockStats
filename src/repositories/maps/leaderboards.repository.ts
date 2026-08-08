import { db } from "../../db/index.js";
import { ilike, and, eq, count } from "drizzle-orm";
import {
  leaderboardsTable,
  difficultyEnum,
  mapsTable,
} from "../../db/schema.js";
import { Repository } from "../baserepository.js";
import type { DifficultyType } from "../../common/map/leaderboard.js";

export class LeaderboardsRepository extends Repository {
  public static readonly table = leaderboardsTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "id", value: id }]);
  }

  public static async findByMapId(
    id: number,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "mapId", value: id }]);
  }

  public static async findByBeatLeaderId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "blLeaderboardId", value: id }]);
  }

  public static async findByScoreSaberId(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "ssLeaderboardId", value: id }]);
  }

  public static async findOneFromMap(
    mapId: number,
    difficulty: DifficultyType,
    characteristic: string,
  ): Promise<typeof this.row | undefined> {
    const [row] = await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.mapId, mapId),
          eq(this.table.difficulty, difficulty),
          ilike(this.table.characteristic, characteristic),
        ),
      );
    return row;
  }

  public static async findFromMap(
    mapId: number,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "mapId", value: mapId }]);
  }

  public static async countFromMap(mapId: number): Promise<number | undefined> {
    const [data] = await db
      .select({ count: count() })
      .from(this.table)
      .where(eq(this.table.mapId, mapId));
    return data?.count ?? 0;
  }
}
