import EventEmitter from "events";
import { WebSocket } from "ws";
import { SSPPCalulator } from "../../common/ppcalculator.js";

class ScoreSaberApiService extends EventEmitter {
  private _socket = new WebSocket("wss://scoresaber.com/ws");
  private _lastSocketUpdate: Date = new Date();

  constructor() {
    super();

    this.createListeners();

    // Wait for potential socket disconnects
    setInterval(() => {
      const now = new Date();

      if (now.getTime() - this._lastSocketUpdate.getTime() > 60000) {
        console.log(
          "[ScoreSaber] No updates in the last 60 seconds, reconnecting...",
        );
        this._socket.close();
      }
    }, 30000);
  }

  private createListeners() {
    // Listen to score uploads on websocket
    this._socket.addEventListener("message", (message: any) => {
      if (message.data == "Connected to the ScoreSaber WSS") return;
      const messageData = JSON.parse(message.data);
      if (messageData.commandName !== "score") return;
      this.emit("score", messageData.commandData);
      this._lastSocketUpdate = new Date();
    });

    // Listen to close / errors and reconnect
    this._socket.addEventListener("close", () => {
      this.reconnectWebSocket();
    });
    this._socket.addEventListener("error", () => {
      this.reconnectWebSocket();
    });
  }

  /** Get the last recorded ScoreSaber socket update time */
  public get lastSocketUpdate(): Date {
    return this._lastSocketUpdate;
  }

  /**
   * Fetch a ScoreSaber profile using their ID
   * @param userId - Profile ID
   * @returns ScoreSaber profile data
   */
  public async getUserFromId(id: string | number): Promise<any> {
    try {
      const response = await fetch(
        `https://scoresaber.com/api/v2/players/${id}/basic`,
      );
      if (response.status == 404) return null;
      return response.json();
    } catch (error) {
      console.log("Error getting ScoreSaber user: " + error);
      return;
    }
  }

  public async getUserFromLinkedIds(linkedIds: any): Promise<any> {
    return (
      (await this.getUserFromId(linkedIds.steamId)) ??
      (await this.getUserFromId(linkedIds.oculusPCId)) ??
      null
    );
  }

  public async getLeaderboard(leaderboardId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://scoresaber.com/api/v2/leaderboards/${leaderboardId}`,
      );
      if (response.status == 404) return null;
      return response.json();
    } catch (error) {
      console.log("Error getting ScoreSaber leaderboard: " + error);
      return;
    }
  }

  public async getV1Leaderboard(leaderboardId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://scoresaber.com/api/v1/leaderboard/by-id${leaderboardId}/info`,
      );
      if (response.status == 404) return;
      return response.json();
    } catch (error) {
      console.log("Error getting ScoreSaber v1 leaderboard: " + error);
      return;
    }
  }

  public async getV1LeaderboardFromHash(
    hash: string,
    difficulty: number,
  ): Promise<any> {
    try {
      const response = await fetch(
        `https://scoresaber.com/api/v1/leaderboard/by-hash/${hash}/info?difficulty=${difficulty}`,
      );
      if (response.status == 404) return;
      return response.json();
    } catch (error) {
      console.log("Error getting ScoreSaber v1 leaderboard: " + error);
      return;
    }
  }
  public async getRawPP(leaderboardId: string): Promise<number> {
    const leaderboard = await this.getV1Leaderboard(leaderboardId);
    if (!leaderboard) return 0;

    return leaderboard.maxPP;
  }

  public getPP(maxPP: number, accuracy: number, failed: false) {
    return SSPPCalulator.getPP(maxPP, accuracy, failed);
  }

  public async getPPFromLeaderboard(
    leaderboardId: string,
    accuracy: number,
    failed: boolean,
  ) {
    const leaderboard = await this.getV1Leaderboard(leaderboardId);
    if (!leaderboard) return 0;
    if (!leaderboard.maxPP) return 0;

    return SSPPCalulator.getPP(leaderboard.maxPP, accuracy, failed);
  }

  public async getPPFromHash(
    hash: string,
    difficulty: number,
    accuracy: number,
    failed: boolean,
  ) {
    const leaderboard = await this.getV1LeaderboardFromHash(hash, difficulty);
    if (!leaderboard) return 0;
    if (!leaderboard.maxPP) return 0;

    return SSPPCalulator.getPP(leaderboard.maxPP, accuracy, failed);
  }

  private reconnectWebSocket() {
    setTimeout(() => {
      this._socket = new WebSocket("wss://scoresaber.com/ws");
      this.createListeners();
    }, 5000);
  }
}

export default new ScoreSaberApiService();
