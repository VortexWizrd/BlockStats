import { db } from "../db/index.js";
import { scoresTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { Repository } from "./baserepository.js";

export class ScoresRepository extends Repository {
  public static readonly table = scoresTable;
  public static readonly row = this.table.$inferInsert;
  public static async findById(
    id: number,
  ): Promise<typeof this.row | undefined> {
    const [row] = await db
      .select()
      .from(scoresTable)
      .where(eq(scoresTable.id, id));
    return row;
  }

  public static async findByBeatLeaderId(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([
      {
        name: "blLeaderboardId",
        value: id,
      },
    ]);
  }
}
