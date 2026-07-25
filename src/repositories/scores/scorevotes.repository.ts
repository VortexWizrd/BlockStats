import { eq, and, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import { scoresTable, scoreVotesTable } from "../../db/schema.js";
import { Repository } from "../baserepository.js";

export class ScoreVotesRepository extends Repository {
  public static readonly table = scoreVotesTable;
  public static readonly row = this.table.$inferInsert;

  public static async getUserVote(scoreId: number, playerId: string) {
    const [row] = await db
      .select()
      .from(scoreVotesTable)
      .where(
        and(
          eq(scoreVotesTable.scoreId, scoreId),
          eq(scoreVotesTable.playerId, playerId),
        ),
      );
    return row;
  }

  public static async setVote(
    scoreId: number,
    playerId: string,
    voteType: "up" | "down",
  ) {
    await db
      .insert(scoreVotesTable)
      .values({ scoreId, playerId, voteType })
      .onConflictDoUpdate({
        target: [scoreVotesTable.scoreId, scoreVotesTable.playerId],
        set: { voteType, timestamp: new Date() },
      });

    await this.updateScoreVoteCounts(scoreId);
  }

  public static async removeVote(scoreId: number, playerId: string) {
    await db
      .delete(scoreVotesTable)
      .where(
        and(
          eq(scoreVotesTable.scoreId, scoreId),
          eq(scoreVotesTable.playerId, playerId),
        ),
      );

    await this.updateScoreVoteCounts(scoreId);
  }

  private static async updateScoreVoteCounts(scoreId: number) {
    const upVotesResult = await db
      .select({ count: count() })
      .from(scoreVotesTable)
      .where(
        and(
          eq(scoreVotesTable.scoreId, scoreId),
          eq(scoreVotesTable.voteType, "up"),
        ),
      );

    const downVotesResult = await db
      .select({ count: count() })
      .from(scoreVotesTable)
      .where(
        and(
          eq(scoreVotesTable.scoreId, scoreId),
          eq(scoreVotesTable.voteType, "down"),
        ),
      );

    const upVotes = Number(upVotesResult[0]?.count ?? 0);
    const downVotes = Number(downVotesResult[0]?.count ?? 0);

    await db
      .update(scoresTable)
      .set({ upVotes: upVotes, downVotes: downVotes })
      .where(eq(scoresTable.id, scoreId));
  }
}
