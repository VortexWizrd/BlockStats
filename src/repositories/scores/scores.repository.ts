import { db } from "../../db/index.js";
import {
  leaderboardsTable,
  scoresTable,
  type ScoreRow,
} from "../../db/schema.js";
import { and, eq, sql, desc, count, or, gt } from "drizzle-orm";
import { Repository } from "../baserepository.js";
import type { DifficultyType } from "../../common/map/leaderboard.js";

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

  public static async findByBeatLeaderScoreId(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([
      {
        name: "blScoreId",
        value: id,
      },
    ]);
  }

  public static async findByScoreSaberScoreId(
    id: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([
      {
        name: "ssScoreId",
        value: id,
      },
    ]);
  }

  public static async getSimilarScore(
    playerId: string,
    songHash: string,
    songDifficulty: string,
    songCharacteristic: string,
    modifiers: string[],
    score: number,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([
      {
        name: "songHash",
        value: songHash,
      },
      {
        name: "songDifficulty",
        value: songDifficulty,
      },
      {
        name: "songCharacteristic",
        value: songCharacteristic,
      },
      {
        name: "modifiers",
        value: modifiers,
      },
      {
        name: "score",
        value: score,
      },
    ]);
  }

  public static async setOutdated(
    playerId: string,
    songHash: string,
    songDifficulty: DifficultyType,
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

  public static async getPlayerTopScoreSaber(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.outdated, false),
          gt(this.table.ppSS, 0),
        ),
      )
      .orderBy(desc(this.table.ppSS))
      .limit(limit)
      .offset(offset);
  }

  public static async getPlayerTopBeatLeader(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.outdated, false),
          gt(this.table.ppBL, 0),
        ),
      )
      .orderBy(desc(this.table.ppBL))
      .limit(limit)
      .offset(offset);
  }

  public static async getPlayerCurrentFromMap(
    playerId: string,
    songHash: string,
    songDifficulty: DifficultyType,
    songCharacteristic: string,
  ): Promise<typeof this.row | undefined> {
    const [row] = await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.songHash, songHash),
          eq(this.table.songDifficulty, songDifficulty),
          eq(this.table.songCharacteristic, songCharacteristic),
          eq(this.table.outdated, false),
        ),
      )
      .orderBy(desc(this.table.timestamp))
      .limit(1);

    return row;
  }

  public static async getCurrentFromMap(
    songHash: string,
    songDifficulty: DifficultyType,
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

  public static async getRecent(
    limit: number,
    offset: number,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .orderBy(desc(this.table.timestamp))
      .limit(limit)
      .offset(offset);
  }

  public static async getPlayerRecent(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .where(eq(this.table.playerId, playerId))
      .orderBy(desc(this.table.timestamp))
      .limit(limit)
      .offset(offset);
  }

  public static async getOldScores(
    playerId: string,
    songHash: string,
    songDifficulty: DifficultyType,
    songCharacteristic: string,
    limit: number,
  ): Promise<(typeof this.row)[]> {
    return await db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.playerId, playerId),
          eq(this.table.songHash, songHash),
          eq(this.table.songDifficulty, songDifficulty),
          eq(this.table.songCharacteristic, songCharacteristic),
          eq(this.table.outdated, true),
        ),
      )
      .orderBy(desc(this.table.id))
      .limit(limit);
  }

  public static async countPlayerScores(
    playerId: string,
    notOutdated: boolean,
  ): Promise<number> {
    if (notOutdated) {
      const [data] = await db
        .select({ count: count() })
        .from(this.table)
        .where(
          and(
            eq(this.table.playerId, playerId),
            eq(this.table.outdated, false),
          ),
        );
      return data?.count ?? 0;
    }
    const [data] = await db
      .select({ count: count() })
      .from(this.table)
      .where(eq(this.table.playerId, playerId));
    return data?.count ?? 0;
  }

  public static async fixDifficulties() {
    await db
      .update(this.table)
      .set({ songDifficulty: leaderboardsTable.difficulty })
      .from(leaderboardsTable)
      .where(eq(this.table.leaderboardId, leaderboardsTable.id));
    await this.mergeAll();
  }

  public static async mergeAll() {
    const scores = await db.select().from(this.table);
    let scoreGroups: Record<string, ScoreRow[]> = {};

    for (const score of scores) {
      const key = `${score.playerId}_${score.songHash.toLowerCase()}_${score.songDifficulty}_${score.songCharacteristic}`;
      if (!scoreGroups[key]) {
        scoreGroups[key] = [];
      }
      scoreGroups[key].push(score);
    }

    for (const key in scoreGroups) {
      const group = scoreGroups[key];
      if (!group) continue;
      if (group.length <= 1) continue;

      const mergedIds = new Set<number>();

      for (let i = 0; i < group.length; i++) {
        const primaryScore = group[i];
        if (!primaryScore) continue;
        if (mergedIds.has(primaryScore.id)) continue;

        for (let j = i + 1; j < group.length; j++) {
          const secondaryScore = group[j];
          if (!secondaryScore) continue;
          if (mergedIds.has(secondaryScore.id)) continue;

          const accDiff = Math.abs(
            primaryScore.accuracy - secondaryScore.accuracy,
          );
          if (accDiff < 0.0001) {
            const combinedProviders = Array.from(
              new Set([...primaryScore.provider, ...secondaryScore.provider]),
            );

            primaryScore.provider = combinedProviders;
            primaryScore.blScoreId =
              primaryScore.blScoreId ?? secondaryScore.blScoreId;
            primaryScore.ssScoreId =
              primaryScore.ssScoreId ?? secondaryScore.ssScoreId;
            primaryScore.blLeaderboardId =
              primaryScore.blLeaderboardId ?? secondaryScore.blLeaderboardId;
            primaryScore.ssLeaderboardId =
              primaryScore.ssLeaderboardId ?? secondaryScore.ssLeaderboardId;
            primaryScore.ppBL =
              primaryScore.blScoreId != null
                ? primaryScore.ppBL
                : secondaryScore.ppBL;
            primaryScore.ppSS =
              primaryScore.ssScoreId != null
                ? primaryScore.ppSS
                : secondaryScore.ppSS;
            primaryScore.blModifiedStarRating =
              primaryScore.blModifiedStarRating ??
              secondaryScore.blModifiedStarRating;
            primaryScore.ssStarRating =
              primaryScore.ssStarRating ?? secondaryScore.ssStarRating;
            primaryScore.blStarRating =
              primaryScore.blStarRating ?? secondaryScore.blStarRating;
            primaryScore.ssRank = primaryScore.ssRank ?? secondaryScore.ssRank;
            primaryScore.blRank = primaryScore.blRank ?? secondaryScore.blRank;
            primaryScore.ssMaxPP =
              primaryScore.ssMaxPP ?? secondaryScore.ssMaxPP;

            await db
              .update(this.table)
              .set({
                provider: primaryScore.provider,
                blScoreId: primaryScore.blScoreId,
                ssScoreId: primaryScore.ssScoreId,
                blLeaderboardId: primaryScore.blLeaderboardId,
                ssLeaderboardId: primaryScore.ssLeaderboardId,
                ppBL: primaryScore.ppBL,
                ppSS: primaryScore.ppSS,
                blModifiedStarRating: primaryScore.blModifiedStarRating,
                ssRank: primaryScore.ssRank,
                blRank: primaryScore.blRank,
                ssMaxPP: primaryScore.ssMaxPP,
                ssStarRating: primaryScore.ssStarRating,
                blStarRating: primaryScore.blStarRating,
              })
              .where(eq(this.table.id, primaryScore.id));

            // Delete the duplicate secondary score
            await db
              .delete(this.table)
              .where(eq(this.table.id, secondaryScore.id));

            // Mark secondary score as processed
            mergedIds.add(secondaryScore.id);
          }
        }
      }
    }
  }
}
