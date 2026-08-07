import type { DifficultyType } from "../common/map/leaderboard.js";
import type Score from "../common/score.js";
import ScoreMessage from "../common/scoremessage.js";
import type { scoresTable } from "../db/schema.js";
import { ScoreMessagesRepository } from "../repositories/scores/scoremessages.repository.js";
import { ScoresRepository } from "../repositories/scores/scores.repository.js";
import { ScoreVotesRepository } from "../repositories/scores/scorevotes.repository.js";

type ScoreInsert = typeof scoresTable.$inferInsert;
export class ScoreService {
  public static async createScore(score: Score): Promise<Score | undefined> {
    try {
      const { id, ...newScore } = score;

      // set score improvement
      const [previousScore] = await ScoresRepository.getOldScores(
        newScore.playerId,
        newScore.songHash,
        newScore.songDifficulty,
        newScore.songCharacteristic,
        1,
      );

      if (previousScore) {
        newScore.improvement = score.accuracy - previousScore.accuracy;
      }

      const scoreInsert = await ScoresRepository.insert(
        newScore as ScoreInsert,
      );
      return scoreInsert as Score;
    } catch (err) {
      console.error("[ERROR] ScoreService: Failed to create score: ", err);
      return undefined;
    }
  }

  public static async getScore(id: number): Promise<Score | undefined> {
    return (await ScoresRepository.findById(id)) as Score;
  }

  public static async getScoreFromBeatLeader(
    id: number,
  ): Promise<Score | undefined> {
    return (await ScoresRepository.findByBeatLeaderScoreId(id)) as Score;
  }

  public static async getScoreFromScoreSaber(
    id: number,
  ): Promise<Score | undefined> {
    return (await ScoresRepository.findByScoreSaberScoreId(id)) as Score;
  }

  public static async count(): Promise<number> {
    return await ScoresRepository.countRows();
  }

  public static async addDiscordMessage(scoreMessage: ScoreMessage) {
    await ScoreMessagesRepository.insert(scoreMessage);
  }

  public static async getScoreMessages(scoreId: number) {
    return await ScoreMessagesRepository.findById(scoreId);
  }

  public static async getFromMessageId(
    messageId: string,
  ): Promise<Score | undefined> {
    const scoreMessage =
      await ScoreMessagesRepository.findByMessageId(messageId);
    if (!scoreMessage || scoreMessage.id <= 0) return undefined;
    return (await ScoresRepository.findById(scoreMessage.id)) as Score;
  }

  public static async getUserVote(scoreId: number, playerId: string) {
    return await ScoreVotesRepository.getUserVote(scoreId, playerId);
  }

  public static async voteScore(
    scoreId: number,
    playerId: string,
    voteType: "up" | "down",
  ) {
    const existingVote = await ScoreVotesRepository.getUserVote(
      scoreId,
      playerId,
    );

    if (existingVote && existingVote.voteType === voteType) {
      await ScoreVotesRepository.removeVote(scoreId, playerId);
      return "removed";
    } else {
      return await ScoreVotesRepository.setVote(scoreId, playerId, voteType);
      return "added";
    }
  }

  public static async setOutdated(
    playerId: string,
    songHash: string,
    songDifficulty: DifficultyType,
    songCharacteristic: string,
  ) {
    await ScoresRepository.setOutdated(
      playerId,
      songHash,
      songDifficulty,
      songCharacteristic,
    );
  }

  public static async getCurrentScoresFromMap(
    songHash: string,
    songDifficulty: DifficultyType,
    songCharacteristic: string,
  ): Promise<Score[]> {
    return (await ScoresRepository.getCurrentFromMap(
      songHash,
      songDifficulty,
      songCharacteristic,
    )) as Score[];
  }

  public static async getRecent(
    limit: number,
    offset: number,
  ): Promise<Score[]> {
    return (await ScoresRepository.getRecent(limit, offset)) as Score[];
  }

  public static async getPlayerRecent(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<Score[]> {
    return (await ScoresRepository.getPlayerRecent(
      playerId,
      limit,
      offset,
    )) as Score[];
  }

  public static async getPlayerTopBeatLeader(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<Score[]> {
    return (await ScoresRepository.getPlayerTopBeatLeader(
      playerId,
      limit,
      offset,
    )) as Score[];
  }

  public static async getPlayerTopScoreSaber(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<Score[]> {
    return (await ScoresRepository.getPlayerTopScoreSaber(
      playerId,
      limit,
      offset,
    )) as Score[];
  }

  public static async getPlayerCurrentFromMap(
    playerId: string,
    songHash: string,
    songDifficulty: DifficultyType,
    songCharacteristic: string,
  ): Promise<Score> {
    return (await ScoresRepository.getPlayerCurrentFromMap(
      playerId,
      songHash,
      songDifficulty,
      songCharacteristic,
    )) as Score;
  }

  public static async countPlayerScores(
    playerId: string,
    notOutdated: boolean,
  ): Promise<number> {
    return await ScoresRepository.countPlayerScores(playerId, notOutdated);
  }

  public static async getSimilarScore(
    playerId: string,
    songHash: string,
    songDifficulty: string,
    songCharacteristic: string,
    modifiers: string[],
    score: number,
  ) {
    return (await ScoresRepository.getSimilarScore(
      playerId,
      songHash,
      songDifficulty,
      songCharacteristic,
      modifiers,
      score,
    )) as Score;
  }
}
