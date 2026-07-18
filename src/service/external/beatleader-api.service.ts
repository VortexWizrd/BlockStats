import EventEmitter from "events";
import { WebSocket } from "ws";

export type LinkedIds = {
  steamId?: string;
  oculusPCId?: string;
  questId?: number;
};

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
        this._socket.close();
      }
    }, 30000);
  }

  /** Get the last recorded BeatLeader socket update time */
  public get lastSocketUpdate(): Date {
    return this._lastSocketUpdate;
  }

  /**
   * Fetch a BeatLeader profile using ID
   * @param id - BeatLeader profile ID
   * @returns BeatLeader profile data, if found
   */
  public async getUser(id: string | number): Promise<any> {
    return await this.fetch<any>(`player/${id}`);
  }

  /**
   * Fetch a BeatLeader profile using a Discord ID
   * @param id - Discord user ID
   * @returns BeatLeader profile data, if found
   */
  public async getUserFromDiscord(id: string | number): Promise<any> {
    return await this.fetch<any>(`player/discord/${id}`);
  }

  private async fetch<T>(path: string): Promise<T | null> {
    const url = `https://api.beatleader.com/${path}`;
    try {
      const res = await fetch(url);
      return res.ok ? (res.json() as T) : null;
    } catch (err) {
      console.warn(
        `[WARN]: BeatLeader API: failed to fetch resource "${url}": ${err}`,
      );
      return null;
    }
  }

  private reconnectWebSocket() {
    setTimeout(() => {
      this._socket = new WebSocket("wss://sockets.api.beatleader.com/scores");
    }, 5000);
  }
}

export default new BeatLeaderApiService();
