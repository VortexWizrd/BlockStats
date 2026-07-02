import type Score from "../common/score.js";
import ScoreMessage from "../common/scoremessage.js";
import type { scoresTable } from "../db/schema.js";
import { ScoreMessagesRepository } from "../repositories/scoremessages.repository.js";
import { ScoresRepository } from "../repositories/scores.repository.js";

type ScoreInsert = typeof scoresTable.$inferInsert;
export class ScoreService {
  public static async createScore(score: Score): Promise<Score | undefined> {
    try {
      const { id, ...newScore } = score;

      const scoreInsert = await ScoresRepository.insert(
        newScore as ScoreInsert,
      );
      return scoreInsert as Score;
    } catch (err) {
      console.log("Error creating score: ", err);
      return undefined;
    }
  }

  public static async getScore(id: number): Promise<Score | undefined> {
    return (await ScoresRepository.findById(id)) as Score;
  }

  public static async count(): Promise<number> {
    return await ScoresRepository.countRows();
  }

  public static async removeUpVoteId(id: number, playerId: string) {
    await ScoresRepository.removeUpVoteId(id, playerId);
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

  public static async addUpVoteId(id: number, playerId: string) {
    await ScoresRepository.appendUpVoteId(id, playerId);
  }

  public static async addDownVoteId(id: number, playerId: string) {
    await ScoresRepository.appendDownVoteId(id, playerId);
  }

  public static async removeDownVoteId(id: number, playerId: string) {
    await ScoresRepository.removeDownVoteId(id, playerId);
  }
}
