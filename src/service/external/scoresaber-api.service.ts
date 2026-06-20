import EventEmitter from "events";
import { WebSocket } from "ws";

class ScoreSaberApiService extends EventEmitter {
  private _socket = new WebSocket("wss://scoresaber.com/ws");
  private _lastSocketUpdate: Date = new Date();

  constructor() {
    super();

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

    // Wait for potential socket disconnects
    setInterval(() => {
      const now = new Date();

      if (now.getTime() - this._lastSocketUpdate.getTime() > 60000) {
        console.log(
          "[ScoreSaber] No updates in the last 60 seconds, reconnecting...",
        );
        this._socket.terminate();
      }
    }, 30000);
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

  private reconnectWebSocket() {
    setTimeout(() => {
      this._socket = new WebSocket("wss://scoresaber.com/ws");
    }, 5000);
  }
}

export default new ScoreSaberApiService();
