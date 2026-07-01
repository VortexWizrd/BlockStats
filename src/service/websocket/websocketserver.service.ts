import { WebSocketServer, WebSocket } from "ws";
import Score from "../../common/score.js";
import beatleaderApiService from "../external/beatleader-api.service.js";
import scoresaberApiService from "../external/scoresaber-api.service.js";
import { PlayerService } from "../player.service.js";

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
              const rankUpdate = {
                playerName: player.name,
                playerAvatar: player.avatar,
                playerUrl: `https://beatleader.com/u/${player.alias ?? player.steamId ?? player.oculusId ?? player.questId ?? "undefined"}`,
                leaderboard: "BeatLeader",
                oldRank:
                  player.blRankHistory[player.blRankHistory.length - 2]?.rank ??
                  0,
                newRank:
                  player.blRankHistory[player.blRankHistory.length - 1]?.rank ??
                  0,
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
            const rankUpdate = {
              playerName: player.name,
              playerAvatar: player.avatar,
              playerUrl: `https://scoresaber.com/u/${player.scoreSaberAlias ?? player.scoreSaberId ?? "undefined"}`,
              leaderboard: "ScoreSaber",
              oldRank:
                player.ssRankHistory[player.ssRankHistory.length - 2]?.rank ??
                0,
              newRank:
                player.ssRankHistory[player.ssRankHistory.length - 1]?.rank ??
                0,
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
              this.sendScore(score);
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

  public sendScore(score: Score) {
    const wrapper = {
      type: "score",
      data: score,
    };
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

  private async tempStoreScore(score: Score) {
    this.scoreStorage.push(score);

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const index = this.scoreStorage.indexOf(score);
    if (index !== -1) {
      this.scoreStorage.splice(index, 1);
      this.sendScore(score);
    }
  }
}

export default new WebSocketServerService();
