import { eq, ilike, sql, or } from "drizzle-orm";
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

  public static async getAll(): Promise<(typeof this.row)[] | undefined> {
    return await db.select().from(this.table);
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

  public static async insert(
    row: typeof this.row,
    updateOnConflict?: boolean,
  ): Promise<typeof this.row | undefined> {
    if (!updateOnConflict) {
      const [newRow] = await db
        .insert(this.table)
        .values(row)
        .onConflictDoNothing()
        .returning();
      return newRow;
    } else {
      const [newRow] = await db
        .insert(this.table)
        .values(row)
        .onConflictDoUpdate({
          target: this.table.hash,
          set: {
            songName: row.songName,
            songSubName: row.songSubName,
            songAuthor: row.songAuthor,
            mapAuthor: row.mapAuthor,
            songCover: row.songCover,
            updatedTime: new Date(),
          },
        })
        .returning();
      return newRow;
    }
  }

  public static async search(
    query: string,
    limit: number,
  ): Promise<(typeof this.row)[]> {
    const searchTerm = `%${query}%`;

    return await db
      .select()
      .from(this.table)
      .where(
        or(
          ilike(this.table.songName, searchTerm),
          ilike(this.table.songAuthor, searchTerm),
          ilike(this.table.mapAuthor, searchTerm),
        ),
      )
      .limit(limit);
  }
}
