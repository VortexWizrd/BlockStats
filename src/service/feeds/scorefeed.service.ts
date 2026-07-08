import type ScoreFeed from "../../common/feed/scorefeed.js";
import type { scoreFeedsTable } from "../../db/schema.js";
import { ScoreFeedsRepository } from "../../repositories/feeds/scorefeeds.repository.js";

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

  public static async count(): Promise<number> {
    return await ScoreFeedsRepository.countRows();
  }

  public static async getGlobalScoreFeeds() {
    return (await ScoreFeedsRepository.findManyByGlobalType()) as ScoreFeed[];
  }

  public static async getBlockStatsGlobalScoreFeeds() {
    return (await ScoreFeedsRepository.findManyByBlockStatsGlobalType()) as ScoreFeed[];
  }

  public static async getConnectedScoreFeeds(id: string) {
    return (await ScoreFeedsRepository.findConnected(id)) as ScoreFeed[];
  }

  public static async addPlayerId(id: number, playerId: string) {
    await ScoreFeedsRepository.appendPlayerId(id, playerId);
  }

  public static async removePlayerId(id: number, playerId: string) {
    await ScoreFeedsRepository.removePlayerId(id, playerId);
  }

  public static async replaceIds(oldId: string, newId: string) {
    if (oldId == "") return;
    await ScoreFeedsRepository.replaceIds(oldId, newId);
  }

  public static async deleteFromChannel(id: string) {
    await ScoreFeedsRepository.delete([{ name: "channelId", value: id }]);
  }

  public static async deleteFromUser(id: string) {
    await ScoreFeedsRepository.delete([{ name: "userId", value: id }]);
  }
}
