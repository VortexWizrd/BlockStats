import { db } from "../db/index.js";
import { playersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

type PlayerRow = typeof playersTable.$inferInsert;
export class PlayersRepository {
  public static async findById(id: string): Promise<PlayerRow | undefined> {
    const [row] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, id));
    return row;
  }

  public static async findBySteamId(
    id: string,
  ): Promise<PlayerRow | undefined> {
    const [row] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.steamId, id));
    return row;
  }

  public static async findByOculusId(
    id: string,
  ): Promise<PlayerRow | undefined> {
    const [row] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.oculusId, id));
    return row;
  }

  public static async findByQuestId(
    id: number,
  ): Promise<PlayerRow | undefined> {
    const [row] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.questId, id));
    return row;
  }

  public static async findByScoreSaberId(
    id: string,
  ): Promise<PlayerRow | undefined> {
    const [row] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.scoreSaberId, id));
    return row;
  }

  public static async insert(row: PlayerRow): Promise<PlayerRow | undefined> {
    const [player] = await db
      .insert(playersTable)
      .values(row)
      .onConflictDoNothing({
        target: playersTable.id,
      })
      .returning();
    return player;
  }
}
