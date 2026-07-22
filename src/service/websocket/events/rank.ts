import { PlayerRankHistoriesRepository } from "../../../repositories/players/playerrankhistories.repository.js";
import { PlayerService } from "../../player.service.js";
import websocketserverService from "../websocketserver.service.js";

export default class WebSocketRankEvent {
  private static blRankedSubmissions = 0;
  private static ssRankedSubmissions = 0;
  private static asRankedSubmissions = 0;

  public static async processBLRank() {
    if (this.blRankedSubmissions >= 5) {
      this.blRankedSubmissions = 0;
      for (const player of await PlayerService.getAllPlayers()) {
        const updatedPlayer = await PlayerService.updateBLRank(player);
        if (!updatedPlayer) continue;
        const latestRanks = await PlayerRankHistoriesRepository.getLatestRows(
          player.id,
          "BeatLeader",
          2,
        );
        if (!latestRanks || latestRanks.length < 2) continue;
        const rankUpdate = {
          playerName: updatedPlayer.name,
          playerAvatar: updatedPlayer.avatar,
          playerId: updatedPlayer.id,
          playerUrl: `https://beatleader.com/u/${updatedPlayer.alias ?? updatedPlayer.steamId ?? updatedPlayer.oculusId ?? updatedPlayer.questId ?? "undefined"}`,
          leaderboard: "BeatLeader",
          oldRank: latestRanks[1]?.rank ?? 0,
          newRank: updatedPlayer.blRank,
          timestamp: Date.now(),
        };
        this.sendRankUpdate(rankUpdate);
      }
    } else {
      this.blRankedSubmissions++;
    }
  }

  public static async processSSRank() {
    if (this.ssRankedSubmissions >= 5) {
      this.ssRankedSubmissions = 0;
      for (const player of await PlayerService.getAllPlayers()) {
        if (!player.scoreSaberId) continue;
        const updatedPlayer = await PlayerService.updateSSRank(player);
        if (!updatedPlayer) continue;
        const latestRanks = await PlayerRankHistoriesRepository.getLatestRows(
          player.id,
          "ScoreSaber",
          2,
        );
        if (!latestRanks || latestRanks.length < 2) continue;
        const rankUpdate = {
          playerName: updatedPlayer.name,
          playerAvatar: updatedPlayer.avatar,
          playerId: updatedPlayer.id,
          playerUrl: `https://scoresaber.com/u/${updatedPlayer.scoreSaberAlias ?? updatedPlayer.scoreSaberId ?? "undefined"}`,
          leaderboard: "ScoreSaber",
          oldRank: latestRanks[1]?.rank ?? 0,
          newRank: updatedPlayer.ssRank,
          timestamp: Date.now(),
        };
        this.sendRankUpdate(rankUpdate);
      }
    } else {
      this.ssRankedSubmissions++;
    }
  }

  public static async processASRank() {
    if (this.asRankedSubmissions >= 1) {
      this.asRankedSubmissions = 0;
      for (const player of await PlayerService.getAllPlayers()) {
        if (!player.accSaberId) continue;
        const updatedPlayer = await PlayerService.updateASRank(player);
        if (!updatedPlayer) continue;
        console.log(player.name, updatedPlayer);
        if (updatedPlayer.asRank != player.asRank) {
          const latestRanks = await PlayerRankHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber",
            2,
          );
          if (!latestRanks || latestRanks.length < 2) continue;
          const rankUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber",
            oldRank: latestRanks[1]?.rank ?? 0,
            newRank: updatedPlayer.asRank,
            timestamp: Date.now(),
          };
          this.sendRankUpdate(rankUpdate);
        }
        if (updatedPlayer.asTechRank != player.asTechRank) {
          const latestRanks = await PlayerRankHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber (Tech Acc)",
            2,
          );
          if (!latestRanks || latestRanks.length < 2) continue;
          const rankUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber (Tech Acc)",
            oldRank: latestRanks[1]?.rank ?? 0,
            newRank: updatedPlayer.asTechRank,
            timestamp: Date.now(),
          };
          this.sendRankUpdate(rankUpdate);
        }
        if (updatedPlayer.asStandardRank != player.asStandardRank) {
          const latestRanks = await PlayerRankHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber (Standard Acc)",
            2,
          );
          if (!latestRanks || latestRanks.length < 2) continue;
          const rankUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber (Standard Acc)",
            oldRank: latestRanks[1]?.rank ?? 0,
            newRank: updatedPlayer.asStandardRank,
            timestamp: Date.now(),
          };
          this.sendRankUpdate(rankUpdate);
        }
        if (updatedPlayer.asTrueRank != player.asTrueRank) {
          const latestRanks = await PlayerRankHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber (True Acc)",
            2,
          );
          if (!latestRanks || latestRanks.length < 2) continue;
          const rankUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber (True Acc)",
            oldRank: latestRanks[1]?.rank ?? 0,
            newRank: updatedPlayer.asTrueRank,
            timestamp: Date.now(),
          };
          this.sendRankUpdate(rankUpdate);
        }
      }
    } else {
      this.asRankedSubmissions++;
    }
  }

  public static sendRankUpdate(rankUpdate: any) {
    const wrapper = {
      type: "rank",
      data: rankUpdate,
    };
    websocketserverService.send(wrapper);
  }
}
