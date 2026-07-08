import type SnipeFeed from "../../common/feed/snipefeed.js";
import type { snipeFeedsTable } from "../../db/schema.js";
import { SnipeFeedsRepository } from "../../repositories/feeds/snipefeeds.repository.js";

type SnipeFeedInsert = typeof snipeFeedsTable.$inferInsert;
export class SnipeFeedService {
  public static async createSnipeFeed(
    snipeFeed: SnipeFeed,
  ): Promise<SnipeFeed | undefined> {
    try {
      const existingRow =
        (await SnipeFeedsRepository.findByUserId(snipeFeed.userId ?? "0")) ??
        (await SnipeFeedsRepository.findByUserId(snipeFeed.channelId ?? "0"));
      if (existingRow) {
        return;
      }

      await SnipeFeedsRepository.insert(snipeFeed as SnipeFeedInsert).then(
        () => {
          return snipeFeed;
        },
      );
    } catch (err) {
      console.log("Error creating Snipe Feed: ", err);
    }
  }

  public static async count(): Promise<number> {
    return await SnipeFeedsRepository.countRows();
  }

  public static async getGlobalSnipeFeeds() {
    return (await SnipeFeedsRepository.findManyByGlobalType()) as SnipeFeed[];
  }

  public static async getBlockStatsGlobalSnipeFeeds() {
    return (await SnipeFeedsRepository.findManyByBlockStatsGlobalType()) as SnipeFeed[];
  }

  public static async getConnectedSnipeFeeds(id: string) {
    return (await SnipeFeedsRepository.findConnected(id)) as SnipeFeed[];
  }

  public static async addPlayerId(id: number, playerId: string) {
    await SnipeFeedsRepository.appendPlayerId(id, playerId);
  }

  public static async removePlayerId(id: number, playerId: string) {
    await SnipeFeedsRepository.removePlayerId(id, playerId);
  }

  public static async replaceIds(oldId: string, newId: string) {
    if (oldId == "") return;
    await SnipeFeedsRepository.replaceIds(oldId, newId);
  }

  public static async deleteFromChannel(id: string) {
    await SnipeFeedsRepository.delete([{ name: "channelId", value: id }]);
  }

  public static async deleteFromUser(id: string) {
    await SnipeFeedsRepository.delete([{ name: "userId", value: id }]);
  }
}
