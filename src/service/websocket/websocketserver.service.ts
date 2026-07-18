import { WebSocketServer, WebSocket } from "ws";
import Score from "../../common/score.js";
import beatleaderApiService from "../external/beatleader-api.service.js";
import scoresaberApiService from "../external/scoresaber-api.service.js";
import { PlayerService } from "../player.service.js";
import { ScoreService } from "../score.service.js";
import { PlayerRankHistoriesRepository } from "../../repositories/players/playerrankhistories.repository.js";
import { MapService } from "../map.service.js";

class WebSocketServerService {
  private server = new WebSocketServer({
    port: 8081,
  });

  private ws: WebSocket | undefined;
  private scoreStorage: Score[] = [];

  private blRankedSubmissions = 0;
  private ssRankedSubmissions = 0;

  constructor() {
    this.server.on("connection", (ws) => {
      if (this.ws === undefined) {
        this.ws = ws;
      }
      console.log("New client connected");

      ws.on("message", (message) => {
        console.log(`Received: ${message}`);
        ws.send(`Server: ${message}`);
      });

      ws.on("close", () => {
        console.log("Client disconnected");
      });

      beatleaderApiService.addListener("score", async (data) => {
        try {
          // Rank feed
          // update every 5 ranked submissions (may change if better alternative)
          if (this.blRankedSubmissions >= 5) {
            this.blRankedSubmissions = 0;
            for (const player of await PlayerService.getAllPlayers()) {
              const updatedPlayer = await PlayerService.updateBLRank(player);
              if (!updatedPlayer) continue;
              const latestRanks =
                await PlayerRankHistoriesRepository.getLatestRows(
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

          // Score feed
          const blConvertedScore = await Score.fromBeatLeader(data);
          if (this.scoreStorage.includes(blConvertedScore)) return;
          for (const score of this.scoreStorage) {
            if (
              score.songHash == blConvertedScore.songHash &&
              score.songDifficulty == blConvertedScore.songDifficulty &&
              score.songCharacteristic == blConvertedScore.songCharacteristic &&
              score.blScoreId == null &&
              !score.provider.includes("BeatLeader") &&
              Math.abs(score.accuracy - blConvertedScore.accuracy) < 0.0002
            ) {
              this.scoreStorage = this.scoreStorage.filter((i) => i !== score);
              score.blLeaderboardId = blConvertedScore.blLeaderboardId;
              score.blRank = blConvertedScore.blRank;
              score.blScoreId = blConvertedScore.blScoreId;
              score.blStarRating = blConvertedScore.blStarRating;
              score.ppBL = blConvertedScore.ppBL;
              score.provider = ["ScoreSaber", "BeatLeader"];
              this.sendScore(score);
              return;
            }
          }
          this.tempStoreScore(blConvertedScore);
        } catch (err) {
          console.log(err);
        }
      });

      scoresaberApiService.addListener("score", async (data) => {
        // Rank feed
        // update every 5 ranked submissions (may change if better alternative)
        if (this.ssRankedSubmissions >= 5) {
          this.ssRankedSubmissions = 0;
          for (const player of await PlayerService.getAllPlayers()) {
            if (!player.scoreSaberId) continue;
            const updatedPlayer = await PlayerService.updateSSRank(player);
            if (!updatedPlayer) continue;
            const latestRanks =
              await PlayerRankHistoriesRepository.getLatestRows(
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

        // Score feed
        try {
          const ssConvertedScore = await Score.fromScoreSaber(data);
          if (this.scoreStorage.includes(ssConvertedScore)) return;
          for (const score of this.scoreStorage) {
            if (
              score.songHash == ssConvertedScore.songHash &&
              score.songDifficulty == ssConvertedScore.songDifficulty &&
              score.songCharacteristic == ssConvertedScore.songCharacteristic &&
              score.ssScoreId == null &&
              !score.provider.includes("ScoreSaber") &&
              Math.abs(score.accuracy - ssConvertedScore.accuracy) < 0.0002
            ) {
              this.scoreStorage = this.scoreStorage.filter((i) => i !== score);
              score.ssLeaderboardId = ssConvertedScore.ssLeaderboardId;
              score.ssRank = ssConvertedScore.ssRank;
              score.ssScoreId = ssConvertedScore.ssScoreId;
              score.ssStarRating = ssConvertedScore.ssStarRating;
              score.ppSS = ssConvertedScore.ppSS;
              score.provider = ["BeatLeader", "ScoreSaber"];
              await this.sendScore(score);
              return;
            }
          }
          this.tempStoreScore(ssConvertedScore);
        } catch (err) {
          console.log(err);
        }
      });
    });
  }

  public async sendScore(score: Score): Promise<void> {
    const wrapper = {
      type: "score",
      data: score,
    };

    // BlockStats features
    const player = await PlayerService.getPlayer(score.playerId);
    if (player) {
      // refresh player profile
      await PlayerService.refreshPlayer(player.id);

      // Handle leaderboard creation (might make a better way to do this later)
      const ssFullMap = await MapService.createFromScoreSaber(
        score.songHash,
        true,
      );
      if (ssFullMap && ssFullMap.map.beatSaverId) {
        await MapService.createFromBeatLeader(ssFullMap.map.beatSaverId, true);
      }

      // handle outdated markings
      score.outdated = false;
      if (score.blRank && score.blRank == 0 && !score.ssRank) {
        score.outdated = true;
      } else {
        await ScoreService.setOutdated(
          player.id,
          score.songHash,
          score.songDifficulty,
          score.songCharacteristic,
        );
      }
      const updatedScore = await ScoreService.createScore(score);
      if (updatedScore !== undefined) {
        wrapper.data = updatedScore;
      }
    }
    // handle snipes
    for (const select of await ScoreService.getCurrentScoresFromMap(
      score.songHash,
      score.songDifficulty,
      score.songCharacteristic,
    )) {
      if (
        (select.blRank && select.blRank > 0) ||
        (select.ssRank && select.ssRank > 0)
      ) {
        if (select.accuracy < score.accuracy) {
          const data = {
            score: score,
            snipedScore: select,
          };
          this.sendSnipe(data);
        }
      }
    }
    if (this.ws === undefined) throw new Error("WebSocket not initialized");
    this.ws.send(JSON.stringify(wrapper));
  }

  public sendRankUpdate(rankUpdate: any) {
    const wrapper = {
      type: "rank",
      data: rankUpdate,
    };
    if (this.ws === undefined) throw new Error("WebSocket not initialized");
    this.ws.send(JSON.stringify(wrapper));
  }

  public sendSnipe(snipeUpdate: any) {
    const wrapper = {
      type: "snipe",
      data: snipeUpdate,
    };
    if (this.ws === undefined) throw new Error("WebSocket not initialized");
    this.ws.send(JSON.stringify(wrapper));
  }

  private async tempStoreScore(score: Score) {
    this.scoreStorage.push(score);

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const index = this.scoreStorage.indexOf(score);
    if (index !== -1) {
      this.scoreStorage.splice(index, 1);

      return this.sendScore(score);
    }
  }
}

export default new WebSocketServerService();
