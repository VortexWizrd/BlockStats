import { WebSocketServer, WebSocket } from "ws";
import beatleaderApiService from "../external/beatleader-api.service.js";
import scoresaberApiService from "../external/scoresaber-api.service.js";
import WebSocketScoreEvent from "./events/score.js";
import WebSocketRankEvent from "./events/rank.js";

class WebSocketServerService {
  private server = new WebSocketServer({
    port: 8081,
  });

  private ws: WebSocket | undefined;

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
