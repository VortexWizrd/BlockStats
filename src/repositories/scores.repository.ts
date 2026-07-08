import { db } from "../db/index.js";
import { scoresTable } from "../db/schema.js";
import { and, eq, sql } from "drizzle-orm";
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

  public static async addMessage(
    messageId: string,
    channelId?: string,
    guildId?: string,
    userId?: string,
  ) {
    await db.update(this.table).set({
      messages: sql`${this.table.messages} || ${JSON.stringify([{ messageId: messageId, channelId: channelId, guildId: guildId, userId: userId }])}::jsonb`,
    });
  }

  public static async appendUpVoteId(
    id: number,
    playerId: string,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        upVoteIds: sql`array_append(${this.table.upVoteIds}, ${playerId})`,
      })
      .where(eq(this.table.id, id));
  }

  public static async appendDownVoteId(
    id: number,
    playerId: string,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        downVoteIds: sql`array_append(${this.table.downVoteIds}, ${playerId})`,
      })
      .where(eq(this.table.id, id));
  }

  public static async removeUpVoteId(
    id: number,
    playerId: string,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        upVoteIds: sql`array_remove(${this.table.upVoteIds}, ${playerId})`,
      })
      .where(eq(this.table.id, id));
  }

  public static async removeDownVoteId(
    id: number,
    playerId: string,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        downVoteIds: sql`array_remove(${this.table.downVoteIds}, ${playerId})`,
      })
      .where(eq(this.table.id, id));
  }

  public static async setOutdated(
    playerId: string,
    songHash: string,
    songDifficulty: string,
    songCharacteristic: string,
  ): Promise<void> {
    await db
      .update(this.table)
      .set({
        outdated: true,
      })
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.songHash, songHash),
          eq(this.table.songDifficulty, songDifficulty),
          eq(this.table.songCharacteristic, songCharacteristic),
        ),
      );
  }

  public static async getCurrentFromMap(
    songHash: string,
    songDifficulty: string,
    songCharacteristic: string,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.songHash, songHash),
          eq(this.table.songDifficulty, songDifficulty),
          eq(this.table.songCharacteristic, songCharacteristic),
          eq(this.table.outdated, false),
        ),
      );
  }
}
