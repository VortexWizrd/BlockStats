import { WebSocketServer, WebSocket } from "ws";
import Score from "../../common/score.js";
import beatleaderApiService from "../external/beatleader-api.service.js";
import scoresaberApiService from "../external/scoresaber-api.service.js";

class WebSocketServerService {
  private server = new WebSocketServer({
    port: 8081,
  });

  private ws: WebSocket | undefined;
  private scoreStorage: Score[] = [];

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
          const blConvertedScore = await Score.fromBeatLeader(data);
          if (this.scoreStorage.includes(blConvertedScore)) return;
          for (const score of this.scoreStorage) {
            if (
              score.songHash == blConvertedScore.songHash &&
              score.songDifficulty == blConvertedScore.songDifficulty &&
              score.songCharacteristic == blConvertedScore.songCharacteristic &&
              score.score == blConvertedScore.score
            ) {
              this.scoreStorage = this.scoreStorage.filter((i) => i !== score);
              score.blLeaderboardId = blConvertedScore.blLeaderboardId;
              score.blRank = blConvertedScore.blRank;
              score.blScoreId = blConvertedScore.blScoreId;
              score.blStarRating = blConvertedScore.blStarRating;
              score.ppBL = blConvertedScore.ppBL;
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
        try {
          const ssConvertedScore = await Score.fromScoreSaber(data);
          if (this.scoreStorage.includes(ssConvertedScore)) return;
          for (const score of this.scoreStorage) {
            if (
              score.songHash == ssConvertedScore.songHash &&
              score.songDifficulty == ssConvertedScore.songDifficulty &&
              score.songCharacteristic == ssConvertedScore.songCharacteristic &&
              score.score == ssConvertedScore.score
            ) {
              this.scoreStorage = this.scoreStorage.filter((i) => i !== score);
              score.ssLeaderboardId = ssConvertedScore.ssLeaderboardId;
              score.ssRank = ssConvertedScore.ssRank;
              score.ssScoreId = ssConvertedScore.ssScoreId;
              score.ssStarRating = ssConvertedScore.ssStarRating;
              score.ppSS = ssConvertedScore.ppSS;
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
    if (this.ws === undefined) throw new Error("WebSocket not initialized");
    this.ws.send(JSON.stringify(score));
  }

  private async tempStoreScore(score: Score) {
    this.scoreStorage.push(score);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const index = this.scoreStorage.indexOf(score);
    if (index !== -1) {
      this.scoreStorage.splice(index, 1);
      this.sendScore(score);
    }
  }
}

export default new WebSocketServerService();
