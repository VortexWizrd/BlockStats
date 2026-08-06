import { eq, ilike, sql, or } from "drizzle-orm";
import { mapDownloadsTable } from "../../db/schema.js";
import { Repository } from "../baserepository.js";
import { db } from "../../db/index.js";

export class MapDownloadsRepository extends Repository {
  public static readonly table = mapDownloadsTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "id", value: id }]);
  }

  public static async getAll(): Promise<(typeof this.row)[] | undefined> {
    return await db.select().from(this.table);
  }

  public static async findByMapId(
    id: number,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "mapId", value: id }]);
  }
}
