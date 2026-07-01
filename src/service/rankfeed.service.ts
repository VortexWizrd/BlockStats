import type RankFeed from "../common/rankfeed.js";
import type { rankFeedsTable } from "../db/schema.js";
import { RankFeedsRepository } from "../repositories/rankfeeds.repository.js";
import { ScoreFeedsRepository } from "../repositories/scorefeeds.repository.js";

type RankFeedInsert = typeof rankFeedsTable.$inferInsert;
export class RankFeedService {
  public static async createRankFeed(
    rankFeed: RankFeed,
  ): Promise<RankFeed | undefined> {
    try {
      const existingRow =
        (await ScoreFeedsRepository.findByUserId(rankFeed.userId ?? "0")) ??
        (await ScoreFeedsRepository.findByUserId(rankFeed.channelId ?? "0"));
      if (existingRow) {
        return;
      }

      await RankFeedsRepository.insert(rankFeed as RankFeedInsert).then(() => {
        return rankFeed;
      });
    } catch (err) {
      console.log("Error creating Rank Feed: ", err);
    }
  }

  public static async getGlobalRankFeeds() {
    return (await RankFeedsRepository.findManyByGlobalType()) as RankFeed[];
  }
}
