import type { RankHistory } from "../common/player.js";
import Player from "../common/player.js";
import type { PlayerRow } from "../db/schema.js";
import { PlayerRankHistoriesRepository } from "../repositories/players/playerrankhistories.repository.js";
import { PlayersRepository } from "../repositories/players/players.repository.js";
import accsaberApiService from "./external/accsaber-api.service.js";
import beatleaderApiService from "./external/beatleader-api.service.js";
import hitbloqApiService from "./external/hitbloq-api.service.js";
import scoresaberApiService from "./external/scoresaber-api.service.js";
import { RankFeedService } from "./feeds/rankfeed.service.js";
import { ScoreFeedService } from "./feeds/scorefeed.service.js";

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

      let scoreSaberData = await scoresaberApiService.getUserFromLinkedIds(
        beatLeaderData.linkedIds ?? { steamId: beatLeaderData.id },
      );

      if (scoreSaberData && scoreSaberData.inactive) {
        const altScoreSaberData =
          await scoresaberApiService.getUserFromLinkedIds({
            oculusPCId: beatLeaderData.linkedIds?.oculusPCId ?? "",
          });
        if (altScoreSaberData && !altScoreSaberData.inactive) {
          scoreSaberData = altScoreSaberData;
        }
      }

      const playerInsert: PlayerRow = {
        id: discordId,

        steamId: (beatLeaderData.linkedIds?.steamId as string) ?? null,
        oculusId: (beatLeaderData.linkedIds?.oculusPCId as string) ?? null,
        questId: beatLeaderData.linkedIds?.questId
          ? Number(beatLeaderData.linkedIds?.questId)
          : null,
        alias: beatLeaderData.alias ?? null,
        beatLeaderId: beatLeaderData.id,

        scoreSaberId: scoreSaberData.id ?? null,
        scoreSaberAlias: scoreSaberData.vanity ?? null,

        accSaberId: scoreSaberData.id ?? null,

        hitBloqId:
          (await hitbloqApiService.getUserFromScoreSaber(scoreSaberData?.id)) ??
          null,

        blRank: beatLeaderData.rank > 0 ? beatLeaderData.rank : null,
        ssRank:
          scoreSaberData.stats?.rank > 0 ? scoreSaberData.stats.rank : null,
        asRank: null,
        overallRank: null,

        totalScores: 0,
        name: beatLeaderData.name,
        avatar: beatLeaderData.avatar,
        beatSaverId: null,
        accentColor: null,
        status: null,
        asTechRank: null,
        asTrueRank: null,
        asStandardRank: null,
        blPP: null,
        blTechPP: null,
        blPassPP: null,
        blAccPP: null,
        ssPP: null,
        asPP: null,
        asTechPP: null,
        asTruePP: null,
        asStandardPP: null,
        overallPP: null,
        lastScoreTime: null,
        createdTime: new Date(),
        updatedTime: new Date(),
      };

      const newPlayer = await PlayersRepository.insert(playerInsert);
      if (!newPlayer) return undefined;
      if (newPlayer.blRank) {
        await PlayerRankHistoriesRepository.insert({
          playerId: newPlayer.id,
          provider: "BeatLeader",
          timestamp: new Date(),
          rank: playerInsert.blRank,
        });
      }
      if (newPlayer.ssRank) {
        await PlayerRankHistoriesRepository.insert({
          playerId: newPlayer.id,
          provider: "ScoreSaber",
          timestamp: new Date(),
          rank: playerInsert.ssRank,
        });
      }
      if (newPlayer.asRank) {
        await PlayerRankHistoriesRepository.insert({
          playerId: newPlayer.id,
          provider: "AccSaber",
          timestamp: new Date(),
          rank: playerInsert.asRank,
        });
      }

      return newPlayer as Player;
    } catch (err) {
      console.error("[ERROR] PlayerService: Failed to create player: ", err);
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
      console.error("[ERROR] PlayerService: Failed to get player: ", err);
    }
  }

  public static async refreshPlayer(id: string) {
    try {
      const existingRow = await PlayersRepository.findById(id);
      if (!existingRow) {
        return;
      }

      const beatLeaderData = await beatleaderApiService.getUserFromDiscord(id);
      if (!beatLeaderData) return;

      let scoreSaberData = await scoresaberApiService.getUserFromLinkedIds(
        beatLeaderData.linkedIds ?? { steamId: beatLeaderData.id },
      );

      if (scoreSaberData && scoreSaberData.inactive) {
        const altScoreSaberData =
          await scoresaberApiService.getUserFromLinkedIds({
            oculusPCId: beatLeaderData.linkedIds?.oculusPCId ?? "",
          });
        if (altScoreSaberData && !altScoreSaberData.inactive) {
          scoreSaberData = altScoreSaberData;
        }
      }

      const data = {
        name: beatLeaderData.name,
        avatar: beatLeaderData.avatar,
        steamId: (beatLeaderData.linkedIds?.steamId as string) ?? null,
        oculusId: (beatLeaderData.linkedIds?.oculusPCId as string) ?? null,
        questId: beatLeaderData.linkedIds?.questId
          ? Number(beatLeaderData.linkedIds?.questId)
          : null,
        alias: beatLeaderData.alias ?? null,
        beatLeaderId: beatLeaderData.id,

        scoreSaberId: scoreSaberData.id ?? null,
        scoreSaberAlias: scoreSaberData.vanity ?? null,

        blRank:
          (await PlayerRankHistoriesRepository.getLatestRow(id, "BeatLeader"))
            ?.rank ?? null,

        ssRank:
          (await PlayerRankHistoriesRepository.getLatestRow(id, "ScoreSaber"))
            ?.rank ?? null,

        accSaberId: scoreSaberData.id ?? null,

        hitBloqId:
          (await hitbloqApiService.getUserFromScoreSaber(scoreSaberData?.id)) ??
          null,
      };

      await PlayersRepository.update(id, data);
    } catch (err) {
      console.error("[ERROR] PlayerService: Failed to update player: ", err);
    }
  }

  public static async refreshAllPlayers() {
    const players = await PlayersRepository.getAll();
    if (!players) return;

    for (const existingRow of players) {
      await this.refreshPlayer(existingRow.id);
    }
  }
  public static async getPlayerByAllIds(
    id: string,
  ): Promise<Player | undefined> {
    return (await PlayersRepository.findByAllIds(id)) as Player;
  }

  public static async count(): Promise<number> {
    return await PlayersRepository.countRows();
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
      console.error(
        "[ERROR] PlayerService: Failed to get player from BeatLeader ID: ",
        err,
      );
    }
  }

  public static async getPlayerFromScoreSaber(
    scoreSaberId: string,
  ): Promise<Player | undefined> {
    try {
      const player = await PlayersRepository.findByScoreSaberId(scoreSaberId);
      return player as Player;
    } catch (err) {
      console.error(
        "[ERROR] PlayerService: Failed to get player from BeatLeader ID: ",
        err,
      );
    }
  }

  public static async getAllPlayers(): Promise<Player[]> {
    try {
      return (await PlayersRepository.getAll()) as Player[];
    } catch (err) {
      console.error("[ERROR] PlayerService: Failed to get all players: ", err);
      return [];
    }
  }

  public static async updateBLRank(
    player: Player,
  ): Promise<Player | undefined> {
    const blUser = await beatleaderApiService.getUserFromDiscord(player.id);
    if (!blUser) return;
    if (blUser.rank <= 0) return;

    if (!player.blRank) {
      await PlayerRankHistoriesRepository.insert({
        playerId: player.id,
        provider: "BeatLeader",
        timestamp: new Date(),
        rank: blUser.rank,
      });
      return (await PlayersRepository.updateBLRank(
        player.id,
        blUser.rank,
      )) as Player;
    } else {
      if (player.blRank != blUser.rank) {
        await PlayerRankHistoriesRepository.insert({
          playerId: player.id,
          provider: "BeatLeader",
          timestamp: new Date(),
          rank: blUser.rank,
        });
        return (await PlayersRepository.updateBLRank(
          player.id,
          blUser.rank,
        )) as Player;
      }
    }
    return undefined;
  }

  public static async updateSSRank(
    player: Player,
  ): Promise<Player | undefined> {
    const ssUser = await scoresaberApiService.getUserFromId(
      player.scoreSaberId ?? "-1",
    );
    if (!ssUser) return;
    if (ssUser.stats.rank <= 0) return;

    if (!player.ssRank) {
      await PlayerRankHistoriesRepository.insert({
        playerId: player.id,
        provider: "ScoreSaber",
        timestamp: new Date(),
        rank: ssUser.stats.rank,
      });
      await PlayersRepository.updateSSPP(player.id, ssUser.stats.totalPP ?? 0);
      return (await PlayersRepository.updateSSRank(
        player.id,
        ssUser.stats.rank,
      )) as Player;
    } else {
      if (player.ssRank != ssUser.stats.rank) {
        await PlayerRankHistoriesRepository.insert({
          playerId: player.id,
          provider: "ScoreSaber",
          timestamp: new Date(),
          rank: ssUser.stats.rank,
        });
        await PlayersRepository.updateSSPP(
          player.id,
          ssUser.stats.totalPP ?? 0,
        );
        return (await PlayersRepository.updateSSRank(
          player.id,
          ssUser.stats.rank,
        )) as Player;
      }
    }
    return undefined;
  }

  public static async updateASRank(
    player: Player,
  ): Promise<Player | undefined> {
    const asUser = await accsaberApiService.getPlayer(
      player.accSaberId ?? "-1",
    );
    if (!asUser) return;
    for (const stat of asUser.statistics) {
      const categoryName = accsaberApiService.getCategoryNameFromId(
        stat.categoryId,
      );
      switch (categoryName) {
        case "Tech Acc":
          if (!player.asTechRank || player.asTechRank != stat.ranking) {
            await PlayerRankHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber (${categoryName})`,
              timestamp: new Date(),
              rank: stat.ranking,
            });
            (await PlayersRepository.updateASRank(
              player.id,
              stat.ranking,
              categoryName,
            )) as Player;
          }
          break;

        case "Standard Acc":
          if (!player.asStandardRank || player.asStandardRank != stat.ranking) {
            await PlayerRankHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber (${categoryName})`,
              timestamp: new Date(),
              rank: stat.ranking,
            });
            (await PlayersRepository.updateASRank(
              player.id,
              stat.ranking,
              categoryName,
            )) as Player;
          }
          break;

        case "True Acc":
          if (!player.asTrueRank || player.asTrueRank != stat.ranking) {
            await PlayerRankHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber (${categoryName})`,
              timestamp: new Date(),
              rank: stat.ranking,
            });
            (await PlayersRepository.updateASRank(
              player.id,
              stat.ranking,
              categoryName,
            )) as Player;
          }
          break;

        case "Overall":
          if (!player.asRank || player.asRank != stat.ranking) {
            await PlayerRankHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber`,
              timestamp: new Date(),
              rank: stat.ranking,
            });
            (await PlayersRepository.updateASRank(
              player.id,
              stat.ranking,
              categoryName,
            )) as Player;
          }
          break;
      }
    }

    return undefined;
  }

  public static async getTopBL(
    limit: number,
    offset: number,
  ): Promise<Player[]> {
    return (await PlayersRepository.getTopBL(limit, offset)) as Player[];
  }

  public static async getTopSS(
    limit: number,
    offset: number,
  ): Promise<Player[]> {
    return (await PlayersRepository.getTopSS(limit, offset)) as Player[];
  }

  public static async setPlayerAccentColor(id: string, color: string) {
    await PlayersRepository.update(id, {
      accentColor: color,
    });
  }
}
