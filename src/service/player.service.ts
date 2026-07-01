import type { RankHistory } from "../common/player.js";
import type Player from "../common/player.js";
import type { PlayerRow } from "../db/schema.js";
import { PlayersRepository } from "../repositories/players.repository.js";
import beatleaderApiService from "./external/beatleader-api.service.js";
import hitbloqApiService from "./external/hitbloq-api.service.js";
import scoresaberApiService from "./external/scoresaber-api.service.js";

export class PlayerService {
  public static async createPlayer(
    discordId: string,
  ): Promise<Player | undefined> {
    try {
      const existingRow = await PlayersRepository.findById(discordId);
      if (existingRow) {
        return;
      }

      const beatLeaderData =
        await beatleaderApiService.getUserFromDiscord(discordId);
      if (!beatLeaderData) return;

      console.log(beatLeaderData);

      const scoreSaberData = await scoresaberApiService.getUserFromLinkedIds(
        beatLeaderData.linkedIds,
      );

      console.log(scoreSaberData);

      const playerInsert: PlayerRow = {
        id: discordId,

        steamId: (beatLeaderData.linkedIds.steamId as string) ?? null,
        oculusId: (beatLeaderData.linkedIds.oculusPCId as string) ?? null,
        questId: Number(beatLeaderData.linkedIds.questId) ?? null,
        alias: beatLeaderData.alias ?? null,
        beatLeaderId: beatLeaderData.id,

        scoreSaberId: scoreSaberData.id ?? null,
        scoreSaberAlias: scoreSaberData.vanity ?? null,

        accSaberId: scoreSaberData.id ?? null,

        hitBloqId:
          (await hitbloqApiService.getUserFromScoreSaber(scoreSaberData?.id)) ??
          null,

        blRankHistory: [
          {
            timestamp: Date.now(),
            rank: beatLeaderData.rank,
          },
        ],
        ssRankHistory: scoreSaberData
          ? [
              {
                timestamp: Date.now(),
                rank: scoreSaberData.rank,
              },
            ]
          : null,
        asRankHistory: null,
        overallRankHistory: null,

        totalScores: 0,
        name: beatLeaderData.name,
        avatar: beatLeaderData.avatar,
      };

      if (scoreSaberData) {
        (playerInsert.ssRankHistory as RankHistory).push({
          timestamp: Date.now(),
          rank: scoreSaberData.stats.rank,
        });
      }

      await PlayersRepository.insert(playerInsert).then(() => {
        return playerInsert as Player;
      });
    } catch (err) {
      console.log("Error creating player: ", err);
    }
  }

  public static async getPlayer(
    discordId: string,
  ): Promise<Player | undefined> {
    try {
      const existingRow = await PlayersRepository.findById(discordId);
      if (!existingRow) {
        return;
      }
      return existingRow as Player;
    } catch (err) {
      console.log("Error getting player: ", err);
    }
  }

  public static async getPlayerFromBeatLeader(
    beatLeaderId: string,
  ): Promise<Player | undefined> {
    try {
      const steam = await PlayersRepository.findBySteamId(beatLeaderId);
      if (!steam) {
        const oculus = await PlayersRepository.findByOculusId(beatLeaderId);
        if (!oculus) {
          const questId = Number(beatLeaderId);
          if (questId > 2147483647) return;
          return (await PlayersRepository.findByQuestId(questId)) as Player;
        }
        return oculus as Player;
      }
      return steam as Player;
    } catch (err) {
      console.log("Error getting player from BeatLeader ID: ", err);
    }
  }

  public static async getPlayerFromScoreSaber(
    scoreSaberId: string,
  ): Promise<Player | undefined> {
    try {
      const player = await PlayersRepository.findByScoreSaberId(scoreSaberId);
      return player as Player;
    } catch (err) {
      console.log("Error getting player from BeatLeader ID: ", err);
    }
  }

  public static async getAllPlayers(): Promise<Player[]> {
    try {
      return (await PlayersRepository.getAll()) as Player[];
    } catch (err) {
      console.log("Error getting all players: ", err);
      return [];
    }
  }

  public static async updateBLRank(
    player: Player,
  ): Promise<Player | undefined> {
    const blUser = await beatleaderApiService.getUserFromDiscord(player.id);
    if (!blUser) return;

    if (!player.blRankHistory || player.blRankHistory.length <= 0) {
      return (await PlayersRepository.updateBLRank(player.id, {
        timestamp: Date.now(),
        rank: blUser.rank,
      })) as Player;
    } else {
      if (
        player.blRankHistory[player.blRankHistory.length - 1]?.rank !=
        blUser.rank
      ) {
        return (await PlayersRepository.updateBLRank(player.id, {
          timestamp: Date.now(),
          rank: blUser.rank,
        })) as Player;
      }
    }
    return undefined;
  }
}
