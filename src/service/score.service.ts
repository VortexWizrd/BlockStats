import type Score from "../common/score.js";
import type { scoresTable } from "../db/schema.js";
import { ScoresRepository } from "../repositories/scores.repository.js";

type ScoreInsert = typeof scoresTable.$inferInsert;
export class ScoreService {
  public static async createScore(score: Score): Promise<Score | undefined> {
    try {
      const newScore = {
        ...score,
        id: undefined,
      };

      const scoreInsert = await ScoresRepository.insert(
        newScore as ScoreInsert,
      );
      return scoreInsert as Score;
    } catch (err) {
      console.log("Error creating score: ", err);
      return undefined;
    }
  }

  public static async count(): Promise<number> {
    return await ScoresRepository.countRows();
  }
}
