import { PlayerPPHistoriesRepository } from "../../../repositories/players/playerpphistories.repository.js";
import beatleaderApiService from "../../external/beatleader-api.service.js";
import scoresaberApiService from "../../external/scoresaber-api.service.js";
import { PlayerService } from "../../player.service.js";
import websocketserverService from "../websocketserver.service.js";

export default class WebSocketPPEvent {
  private static blRankedSubmissions = 0;
  private static blUpdating = false;
  private static ssRankedSubmissions = 0;
  private static ssUpdating = false;
  private static asRankedSubmissions = 0;
  private static asUpdating = false;

  public static async processBLPP(skipCooldown?: boolean) {
    if (this.blUpdating) return;
    if (this.blRankedSubmissions >= 5 || skipCooldown) {
      this.blUpdating = true;
      this.blRankedSubmissions = 0;
      for (const player of await PlayerService.getAllPlayers()) {
        const updatedPlayer = await PlayerService.updateBLPP(player, false);
        if (!updatedPlayer) continue;
        const latestPPs = await PlayerPPHistoriesRepository.getLatestRows(
          player.id,
          "BeatLeader",
          2,
        );
        if (!latestPPs || latestPPs.length < 2) continue;

        const abovePlayer = await beatleaderApiService.getUserFromRank(
          (updatedPlayer.blRank ?? -1) - 1,
        );
        const ppUpdate = {
          playerName: updatedPlayer.name,
          playerAvatar: updatedPlayer.avatar,
          playerId: updatedPlayer.id,
          playerUrl: `https://beatleader.com/u/${updatedPlayer.alias ?? updatedPlayer.steamId ?? updatedPlayer.oculusId ?? updatedPlayer.questId ?? "undefined"}`,
          leaderboard: "BeatLeader",
          oldPP: latestPPs[1]?.pp ?? 0,
          newPP: updatedPlayer.blPP,
          abovePlayerName: abovePlayer?.name ?? undefined,
          abovePlayerPP: abovePlayer?.pp ?? undefined,
          timestamp: Date.now(),
        };
        this.sendPPUpdate(ppUpdate);
      }
      this.blUpdating = false;
    } else {
      this.blRankedSubmissions++;
    }
  }

  public static async processSSPP(skipCooldown?: boolean) {
    if (this.ssUpdating) return;
    if (this.ssRankedSubmissions >= 5 || skipCooldown) {
      this.ssUpdating = true;
      this.ssRankedSubmissions = 0;
      for (const player of await PlayerService.getAllPlayers()) {
        if (!player.scoreSaberId) continue;
        const updatedPlayer = await PlayerService.updateSSPP(player, false);
        if (!updatedPlayer) continue;
        const latestPPs = await PlayerPPHistoriesRepository.getLatestRows(
          player.id,
          "ScoreSaber",
          2,
        );
        if (!latestPPs || latestPPs.length < 2) continue;

        const abovePlayer = await scoresaberApiService.getUserFromRank(
          (updatedPlayer.ssRank ?? -1) - 1,
        );

        const ppUpdate = {
          playerName: updatedPlayer.name,
          playerAvatar: updatedPlayer.avatar,
          playerId: updatedPlayer.id,
          playerUrl: `https://scoresaber.com/u/${updatedPlayer.scoreSaberAlias ?? updatedPlayer.scoreSaberId ?? "undefined"}`,
          leaderboard: "ScoreSaber",
          pp: updatedPlayer.ssPP ?? undefined,
          oldPP: latestPPs[1]?.pp ?? 0,
          newPP: updatedPlayer.ssPP,
          abovePlayerName: abovePlayer?.name ?? undefined,
          abovePlayerPP: abovePlayer?.stats?.totalPP ?? undefined,
          timestamp: Date.now(),
        };
        this.sendPPUpdate(ppUpdate);
      }
      this.ssUpdating = false;
    } else {
      this.ssRankedSubmissions++;
    }
  }

  public static async processASPP(skipCooldown?: boolean) {
    if (this.asUpdating) return;
    if (this.asRankedSubmissions >= 1 || skipCooldown) {
      this.asUpdating = true;
      this.asRankedSubmissions = 0;
      for (const player of await PlayerService.getAllPlayers()) {
        if (!player.accSaberId) continue;
        const updatedPlayer = await PlayerService.updateASPP(player, false);
        if (!updatedPlayer) continue;
        if (updatedPlayer.asPP != player.asPP) {
          const latestPPs = await PlayerPPHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber",
            2,
          );
          if (!latestPPs || latestPPs.length < 2) continue;
          const ppUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber",
            oldPP: latestPPs[1]?.pp ?? 0,
            newPP: updatedPlayer.asPP,
            timestamp: Date.now(),
          };
          this.sendPPUpdate(ppUpdate);
        }
        if (updatedPlayer.asTechPP != player.asTechPP) {
          const latestPPs = await PlayerPPHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber (Tech Acc)",
            2,
          );
          if (!latestPPs || latestPPs.length < 2) continue;
          const ppUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber (Tech Acc)",
            oldPP: latestPPs[1]?.pp ?? 0,
            newPP: updatedPlayer.asTechPP,
            timestamp: Date.now(),
          };
          this.sendPPUpdate(ppUpdate);
        }
        if (updatedPlayer.asStandardPP != player.asStandardPP) {
          const latestPPs = await PlayerPPHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber (Standard Acc)",
            2,
          );
          if (!latestPPs || latestPPs.length < 2) continue;
          const ppUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber (Standard Acc)",
            oldPP: latestPPs[1]?.pp ?? 0,
            newPP: updatedPlayer.asStandardPP,
            timestamp: Date.now(),
          };
          this.sendPPUpdate(ppUpdate);
        }
        if (updatedPlayer.asTruePP != player.asTruePP) {
          const latestPPs = await PlayerPPHistoriesRepository.getLatestRows(
            player.id,
            "AccSaber (True Acc)",
            2,
          );
          if (!latestPPs || latestPPs.length < 2) continue;
          const ppUpdate = {
            playerName: updatedPlayer.name,
            playerAvatar: updatedPlayer.avatar,
            playerId: updatedPlayer.id,
            playerUrl: `https://accsaber.com.com/players/${updatedPlayer.accSaberId ?? "undefined"}`,
            leaderboard: "AccSaber (True Acc)",
            oldPP: latestPPs[1]?.pp ?? 0,
            newPP: updatedPlayer.asTruePP,
            timestamp: Date.now(),
          };
          this.sendPPUpdate(ppUpdate);
        }
      }
      this.asUpdating = false;
    } else {
      this.asRankedSubmissions++;
    }
  }

  public static sendPPUpdate(ppUpdate: any) {
    const wrapper = {
      type: "pp",
      data: ppUpdate,
    };
    websocketserverService.send(wrapper);
  }
}
