import { leaderboardsTable, mapsTable } from "../../db/schema.js";
import { Repository } from "../baserepository.js";

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
    id: number,
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
    difficulty: string,
    characteristic: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([
      { name: "mapId", value: mapId },
      { name: "difficulty", value: difficulty },
      { name: "characteristic", value: characteristic },
    ]);
  }
}
