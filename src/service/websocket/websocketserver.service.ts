import { WebSocketServer, WebSocket } from "ws";
import Score from "../../common/score.js";
import beatleaderApiService from "../external/beatleader-api.service.js";
import scoresaberApiService from "../external/scoresaber-api.service.js";
import { PlayerService } from "../player.service.js";
import { ScoreService } from "../score.service.js";
import { PlayerRankHistoriesRepository } from "../../repositories/players/playerrankhistories.repository.js";
import { MapService } from "../map.service.js";
import WebSocketScoreEvent from "./events/score.js";
import WebSocketRankEvent from "./events/rank.js";

class WebSocketServerService {
  private server = new WebSocketServer({
    port: 8081,
  });

  private ws: WebSocket | undefined;

  private asRankedSubmissions = 0;

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
        WebSocketRankEvent.processBLRank();
        try {
          WebSocketScoreEvent.processBLScore(data);
        } catch (err) {
          console.log(err);
        }
      });

      scoresaberApiService.addListener("score", async (data) => {
        WebSocketRankEvent.processSSRank();

        // Score feed
        WebSocketScoreEvent.processSSScore(data);
      });
    });
  }

  public async send(wrapper: { type: string; data: any }) {
    if (this.ws === undefined) throw new Error("WebSocket not initialized");
    this.ws.send(JSON.stringify(wrapper));
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
    this.send(wrapper);
  }

  public sendSnipe(snipeUpdate: any) {
    const wrapper = {
      type: "snipe",
      data: snipeUpdate,
    };
    if (this.ws === undefined) throw new Error("WebSocket not initialized");
    this.ws.send(JSON.stringify(wrapper));
  }
}

export default new WebSocketServerService();
