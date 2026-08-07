import Player from "../common/player.js";
import { type PlayerRankHistoryRow, type PlayerRow } from "../db/schema.js";
import { PlayerPPHistoriesRepository } from "../repositories/players/playerpphistories.repository.js";
import { PlayerRankHistoriesRepository } from "../repositories/players/playerrankhistories.repository.js";
import { PlayersRepository } from "../repositories/players/players.repository.js";
import accsaberApiService from "./external/accsaber-api.service.js";
import beatleaderApiService from "./external/beatleader-api.service.js";
import hitbloqApiService from "./external/hitbloq-api.service.js";
import scoresaberApiService from "./external/scoresaber-api.service.js";

export class PlayerService {
  public static async createPlayer(
    discordId: string,
  ): Promise<Player | undefined> {
    try {
      if (await PlayersRepository.findById(discordId)) return;

      const beatLeaderData =
        await beatleaderApiService.getUserFromDiscord(discordId);
      if (!beatLeaderData) return;

      let scoreSaberData = beatLeaderData.linkedIds
        ? await scoresaberApiService.getUserFromLinkedIds(
            beatLeaderData.linkedIds,
          )
        : await scoresaberApiService.getUserFromId(
            beatLeaderData.id.toString(),
          );

      if (scoreSaberData?.inactive && beatLeaderData.linkedIds?.oculusPCId) {
        const altData = await scoresaberApiService.getUserFromLinkedIds({
          oculusPCId: beatLeaderData.linkedIds.oculusPCId,
        });
        if (altData && !altData.inactive) scoreSaberData = altData;
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

        scoreSaberId: scoreSaberData?.id ?? null,
        scoreSaberAlias: scoreSaberData?.vanity ?? null,
        scoreSaberChange: false,

        accSaberId: scoreSaberData?.id ?? null,

        hitBloqId:
          (await hitbloqApiService.getUserFromScoreSaber(
            scoreSaberData?.id ?? "",
          )) ?? null,

        blRank: beatLeaderData.rank > 0 ? beatLeaderData.rank : null,
        ssRank:
          scoreSaberData?.stats?.rank && scoreSaberData.stats?.rank > 0
            ? scoreSaberData.stats.rank
            : null,
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
        await this.createSSRankHistory(newPlayer.id);
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

  public static async createBLRankHistory(playerId: string) {
    try {
      if (await PlayersRepository.findById(playerId)) return;
    } catch (err) {
      console.log(err);
    }
  }

  public static async createSSRankHistory(playerId: string) {
    try {
      const player = await PlayersRepository.findById(playerId);
      if (!player || !player.scoreSaberId) return;
      const history = await scoresaberApiService.getHistory(
        player.scoreSaberId,
        1000,
      );
      if (!history) return;

      const earliestRankHistoryDate =
        (
          await PlayerRankHistoriesRepository.getOldestRow(
            player.id,
            "ScoreSaber",
          )
        )?.timestamp ?? new Date();
      const earliestPPHistoryDate =
        (
          await PlayerPPHistoriesRepository.getOldestRow(
            player.id,
            "ScoreSaber",
          )
        )?.timestamp ?? new Date();

      for (const key in history) {
        const keyDate = new Date(key);
        if (keyDate < earliestRankHistoryDate && history[key].rank) {
          PlayerRankHistoriesRepository.insert({
            playerId: player.id,
            provider: "ScoreSaber",
            timestamp: keyDate,
            rank: history[key].rank,
          });
        }
        if (keyDate < earliestPPHistoryDate && history[key].pp) {
          PlayerPPHistoriesRepository.insert({
            playerId: player.id,
            provider: "ScoreSaber",
            timestamp: keyDate,
            pp: history[key].pp,
          });
        }
      }
    } catch (err) {
      console.log(err);
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

  public static async searchPlayer(
    query: string,
    limit: number,
  ): Promise<Player[]> {
    return (await PlayersRepository.search(query, limit)) as Player[];
  }

  public static async markScoreSaberChange(id: string) {
    return await PlayersRepository.markScoreSaberChange(id);
  }

  public static async changeScoreSaber(id: string, scoreSaberId: string) {
    return await PlayersRepository.changeScoreSaber(id, scoreSaberId);
  }

  public static async refreshPlayer(id: string) {
    try {
      const existingRow = await PlayersRepository.findById(id);
      if (!existingRow) {
        return;
      }

      const beatLeaderData = await beatleaderApiService.getUserFromDiscord(id);
      if (!beatLeaderData) return;

      let scoreSaberData: any;
      if (
        existingRow.scoreSaberId &&
        !Object.values(
          beatLeaderData.linkedIds ?? { steamId: beatLeaderData.id.toString() },
        ).includes(existingRow.scoreSaberId)
      ) {
        scoreSaberData = await scoresaberApiService.getUserFromId(
          existingRow.scoreSaberId,
        );
      } else {
        scoreSaberData = await scoresaberApiService.getUserFromLinkedIds(
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

  public static async updateBLPP(
    player: Player,
    skipValidation: boolean,
    blData?: any,
  ): Promise<Player | undefined> {
    const blUser =
      blData ?? (await beatleaderApiService.getUserFromDiscord(player.id));
    if (!skipValidation) {
      if (!blUser || blUser.rank <= 0) return;
      if (blUser.pp == 0) {
        if (player.blRank != null) {
          await PlayersRepository.updateBLRank(player.id, -1);
          await PlayersRepository.updateBLPP(player.id, -1);
        }
        return undefined;
      }
    }

    if (!player.blPP || player.blPP != blUser.pp) {
      await PlayerPPHistoriesRepository.insert({
        playerId: player.id,
        provider: "BeatLeader",
        timestamp: new Date(),
        pp: blUser.pp,
      });
      return (await PlayersRepository.updateBLPP(
        player.id,
        blUser.pp ?? 0,
      )) as Player;
    }
  }

  public static async updateBLRank(
    player: Player,
    skipValidation: boolean,
    blData?: any,
  ): Promise<Player | undefined> {
    const blUser =
      blData ?? (await beatleaderApiService.getUserFromDiscord(player.id));
    if (!skipValidation) {
      if (!blUser || blUser.rank <= 0) return;
      if (blUser.pp == 0) {
        if (player.blRank != null) {
          await PlayersRepository.updateBLRank(player.id, -1);
          await PlayersRepository.updateBLPP(player.id, -1);
        }
        return undefined;
      }
    }

    if (!player.blRank || player.blRank != blUser.rank) {
      await PlayerRankHistoriesRepository.insert({
        playerId: player.id,
        provider: "BeatLeader",
        timestamp: new Date(),
        rank: blUser.rank,
      });
      return (await PlayersRepository.updateBLRank(
        player.id,
        blUser.rank ?? 0,
      )) as Player;
    }
    return undefined;
  }

  public static async updateSSPP(
    player: Player,
    skipValidation: boolean,
    ssData?: any,
  ): Promise<Player | undefined> {
    const ssUser =
      ssData ??
      (await scoresaberApiService.getUserFromId(player.scoreSaberId ?? ""));
    if (!skipValidation) {
      if (!ssUser || !ssUser.stats?.rank || ssUser.stats.rank <= 0) return;
      if (ssUser.stats.totalPP == 0) {
        if (player.ssRank != null) {
          await PlayersRepository.updateSSRank(player.id, -1);
          await PlayersRepository.updateSSPP(player.id, -1);
        }
        return undefined;
      }
    }

    if (!player.ssPP || player.ssPP != ssUser.stats.totalPP) {
      await PlayerPPHistoriesRepository.insert({
        playerId: player.id,
        provider: "ScoreSaber",
        timestamp: new Date(),
        pp: ssUser.stats.totalPP,
      });
      return (await PlayersRepository.updateSSPP(
        player.id,
        ssUser.stats.totalPP ?? 0,
      )) as Player;
    }
  }

  public static async updateSSRank(
    player: Player,
    skipValidation: boolean,
    ssData?: any,
  ): Promise<Player | undefined> {
    const ssUser =
      ssData ??
      (await scoresaberApiService.getUserFromId(player.scoreSaberId ?? ""));
    if (!skipValidation) {
      if (!ssUser || !ssUser.stats?.rank || ssUser.stats.rank <= 0) return;
      if (ssUser.stats.totalPP == 0) {
        if (player.ssRank != null) {
          await PlayersRepository.updateSSRank(player.id, -1);
          await PlayersRepository.updateSSPP(player.id, -1);
        }
        return undefined;
      }
    }

    if (!player.ssRank || player.ssRank != ssUser.stats.rank) {
      await PlayerRankHistoriesRepository.insert({
        playerId: player.id,
        provider: "ScoreSaber",
        timestamp: new Date(),
        rank: ssUser.stats.rank,
      });
      return (await PlayersRepository.updateSSRank(
        player.id,
        ssUser.stats.rank ?? 0,
      )) as Player;
    }
    return undefined;
  }

  public static async updateASPP(
    player: Player,
    skipValidation: boolean,
    asData?: any,
  ): Promise<Player | undefined> {
    const asUser =
      asData ??
      (await accsaberApiService.getUserFromId(player.accSaberId ?? "-1"));
    if (!skipValidation) {
      if (!asUser) return;
    }
    let updatedPlayer: Player | undefined = undefined;

    for (const stat of asUser.statistics) {
      const categoryName = accsaberApiService.getCategoryNameFromId(
        stat.categoryId,
      );

      switch (categoryName) {
        case "Tech Acc":
          if (!player.asTechRank || player.asTechRank != stat.ap) {
            await PlayerPPHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber (${categoryName})`,
              timestamp: new Date(),
              pp: stat.ap,
            });
            player = (await PlayersRepository.updateASPP(
              player.id,
              stat.ap,
              categoryName,
            )) as Player;
          }
          break;

        case "Standard Acc":
          if (!player.asStandardRank || player.asStandardRank != stat.ranking) {
            await PlayerPPHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber (${categoryName})`,
              timestamp: new Date(),
              pp: stat.ap,
            });
            player = (await PlayersRepository.updateASPP(
              player.id,
              stat.ap,
              categoryName,
            )) as Player;
          }
          break;

        case "True Acc":
          if (!player.asTrueRank || player.asTrueRank != stat.ranking) {
            await PlayerPPHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber (${categoryName})`,
              timestamp: new Date(),
              pp: stat.ap,
            });
            player = (await PlayersRepository.updateASPP(
              player.id,
              stat.ap,
              categoryName,
            )) as Player;
          }
          break;

        case "Overall":
          if (!player.asRank || player.asRank != stat.ranking) {
            await PlayerPPHistoriesRepository.insert({
              playerId: player.id,
              provider: `AccSaber`,
              timestamp: new Date(),
              pp: stat.ap,
            });
            player = (await PlayersRepository.updateASPP(
              player.id,
              stat.ap,
              categoryName,
            )) as Player;
          }
          break;
      }
    }
    return updatedPlayer;
  }

  public static async updateASRank(
    player: Player,
    skipValidation: boolean,
    asData?: any,
  ): Promise<Player | undefined> {
    const asUser =
      asData ??
      (await accsaberApiService.getUserFromId(player.accSaberId ?? "-1"));
    if (!skipValidation) {
      if (!asUser) return;
    }

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
            return (await PlayersRepository.updateASRank(
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
            return (await PlayersRepository.updateASRank(
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
            return (await PlayersRepository.updateASRank(
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
            return (await PlayersRepository.updateASRank(
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
