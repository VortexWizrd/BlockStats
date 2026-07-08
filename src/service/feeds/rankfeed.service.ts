import type RankFeed from "../../common/feed/rankfeed.js";
import type { rankFeedsTable } from "../../db/schema.js";
import { RankFeedsRepository } from "../../repositories/feeds/rankfeeds.repository.js";
import { ScoreFeedsRepository } from "../../repositories/feeds/scorefeeds.repository.js";

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

  public static async count(): Promise<number> {
    return await RankFeedsRepository.countRows();
  }

  public static async getGlobalRankFeeds() {
    return (await RankFeedsRepository.findManyByGlobalType()) as RankFeed[];
  }

  public static async getBlockStatsGlobalRankFeeds() {
    return (await RankFeedsRepository.findManyByBlockStatsGlobalType()) as RankFeed[];
  }

  public static async getConnectedRankFeeds(id: string) {
    return (await RankFeedsRepository.findConnected(id)) as RankFeed[];
  }

  public static async addPlayerId(id: number, playerId: string) {
    await RankFeedsRepository.appendPlayerId(id, playerId);
  }

  public static async removePlayerId(id: number, playerId: string) {
    await RankFeedsRepository.removePlayerId(id, playerId);
  }

  public static async replaceIds(oldId: string, newId: string) {
    if (oldId == "") return;
    await RankFeedsRepository.replaceIds(oldId, newId);
  }

  public static async deleteFromChannel(id: string) {
    await RankFeedsRepository.delete([{ name: "channelId", value: id }]);
  }

  public static async deleteFromUser(id: string) {
    await RankFeedsRepository.delete([{ name: "userId", value: id }]);
  }
}
