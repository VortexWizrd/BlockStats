import type ScoreFeed from "../common/scorefeed.js";
import type { PlayerRow, scoreFeedsTable } from "../db/schema.js";
import { ScoreFeedsRepository } from "../repositories/scorefeeds.repository.js";

type ScoreFeedInsert = typeof scoreFeedsTable.$inferInsert;
export class ScoreFeedService {
  public static async createScoreFeed(
    scoreFeed: ScoreFeed,
  ): Promise<ScoreFeed | undefined> {
    try {
      const existingRow =
        (await ScoreFeedsRepository.findByUserId(scoreFeed.userId ?? "0")) ??
        (await ScoreFeedsRepository.findByUserId(scoreFeed.channelId ?? "0"));
      if (existingRow) {
        return;
      }

      await ScoreFeedsRepository.insert(scoreFeed as ScoreFeedInsert).then(
        () => {
          return scoreFeed;
        },
      );
    } catch (err) {
      console.log("Error creating Score Feed: ", err);
    }
  }

  public static async getGlobalScoreFeeds() {
    return (await ScoreFeedsRepository.findManyByGlobalType()) as ScoreFeed[];
  }
}
