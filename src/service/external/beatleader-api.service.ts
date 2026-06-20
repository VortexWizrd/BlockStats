import EventEmitter from "events";
import { WebSocket } from "ws";

class BeatLeaderApiService extends EventEmitter {
  private _socket = new WebSocket("wss://sockets.api.beatleader.com/scores");
  private _lastSocketUpdate: Date = new Date();

  constructor() {
    super();

    // Listen to score uploads on websocket
    this._socket.addEventListener("message", (message: any) => {
      this.emit("score", JSON.parse(message.data));
      this._lastSocketUpdate = new Date();
    });

    // Listen to close / errors and reconnect
    this._socket.addEventListener("close", () => {
      this.reconnectWebSocket();
    });
    this._socket.addEventListener("error", () => {
      this.reconnectWebSocket();
    });

    // Wait for potential socket disconnects
    setInterval(() => {
      const now = new Date();

      if (now.getTime() - this._lastSocketUpdate.getTime() > 60000) {
        console.log(
          "[BeatLeader] No updates in the last 60 seconds, reconnecting...",
        );
        this._socket.terminate();
      }
    }, 30000);
  }

  /** Get the last recorded BeatLeader socket update time */
  public get lastSocketUpdate(): Date {
    return this._lastSocketUpdate;
  }

  /**
   * Fetch a BeatLeader profile using a Discord ID
   * @param discordId - Discord user ID
   * @returns BeatLeader profile data
   */
  public async getUserFromDiscord(discordId: string | number): Promise<any> {
    try {
      const response = await fetch(
        `https://api.beatleader.com/player/discord/${discordId}`,
        {},
      );
      return response.json();
    } catch (error) {
      console.log("Error fetching BeatLeader user from Discord ID: " + error);
      return;
    }
  }

  public async getScoreStatistic(scoreId: string | number): Promise<any> {
    try {
      const response = await fetch(
        `https://api.beatleader.com/score/statistic/${scoreId}`,
        {},
      );
      return response.json();
    } catch (error) {
      console.log("Error fetching BeatLeader score statistic: " + error);
      return;
    }
  }

  private reconnectWebSocket() {
    setTimeout(() => {
      this._socket = new WebSocket("wss://sockets.api.beatleader.com/scores");
    }, 5000);
  }
}

export default new BeatLeaderApiService();
