import type PPFeed from "../../common/feed/ppfeed.js";
import type { ppFeedsTable } from "../../db/schema.js";
import { PPFeedsRepository } from "../../repositories/feeds/ppfeeds.repository.js";
import { ScoreFeedsRepository } from "../../repositories/feeds/scorefeeds.repository.js";

type PPFeedInsert = typeof ppFeedsTable.$inferInsert;
export class PPFeedService {
  public static async createPPFeed(
    ppFeed: PPFeed,
  ): Promise<PPFeed | undefined> {
    try {
      const existingRow =
        (await PPFeedsRepository.findByUserId(ppFeed.userId ?? "0")) ??
        (await PPFeedsRepository.findByChannelId(ppFeed.channelId ?? "0"));
      if (existingRow) {
        return;
      }

      const { id, ...newFeed } = ppFeed;

      return (await PPFeedsRepository.insert(
        newFeed as PPFeedInsert,
      )) as PPFeed;
    } catch (err) {
      console.log("Error creating PP Feed: ", err);
    }
  }

  public static async count(): Promise<number> {
    return await PPFeedsRepository.countRows();
  }

  public static async getGlobalPPFeeds() {
    return (await PPFeedsRepository.findManyByGlobalType()) as PPFeed[];
  }

  public static async getBlockStatsGlobalPPFeeds() {
    return (await PPFeedsRepository.findManyByBlockStatsGlobalType()) as PPFeed[];
  }

  public static async getConnectedPPFeeds(id: string) {
    return (await PPFeedsRepository.findConnected(id)) as PPFeed[];
  }

  public static async addPlayerId(id: number, playerId: string) {
    await PPFeedsRepository.appendPlayerId(id, playerId);
  }

  public static async removePlayerId(id: number, playerId: string) {
    await PPFeedsRepository.removePlayerId(id, playerId);
  }

  public static async replaceIds(oldId: string, newId: string) {
    if (oldId == "") return;
    await PPFeedsRepository.replaceIds(oldId, newId);
  }

  public static async deleteFromChannel(id: string) {
    await PPFeedsRepository.delete([{ name: "channelId", value: id }]);
  }

  public static async deleteFromUser(id: string) {
    await PPFeedsRepository.delete([{ name: "userId", value: id }]);
  }
}
