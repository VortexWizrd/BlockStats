import EventEmitter from "events";
import { WebSocket } from "ws";
import { SSPPCalulator } from "../../common/ppcalculator.js";
import type { LinkedIds } from "./beatleader-api.service.js";

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
        console.warn(
          "[WARN]: ScoreSaber API: No updates in the last 60 seconds, reconnecting...",
        );
        this._socket.close();
      }
    }, 30000);
  }

  /** Get the last recorded ScoreSaber socket update time */
  public get lastSocketUpdate(): Date {
    return this._lastSocketUpdate;
  }

  /**
   * Estimate ScoreSaber PP
   * @param maxPP Leaderboard max PP
   * @param accuracy Score accuracy
   * @param failed Score failed value
   * @returns ScoreSaber PP value
   */
  public getPP(maxPP: number, accuracy: number, failed: false) {
    return SSPPCalulator.getPP(maxPP, accuracy, failed);
  }

  /**
   * Estimate ScoreSaber PP from hash
   * @param hash ScoreSaber map hash
   * @param difficulty ScoreSaber map difficulty
   * @param accuracy Score accuracy
   * @param failed Score failed value
   * @returns ScoreSaber PP value
   */
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

  /**
   * Estimate ScoreSaber PP from leaderboard
   * @param id ScoreSaber leaderboard ID
   * @param accuracy Score accuracy
   * @param failed Score failed value
   * @returns ScoreSaber PP value
   */
  public async getPPFromLeaderboard(
    id: string,
    accuracy: number,
    failed: boolean,
  ) {
    const leaderboard = await this.getV1Leaderboard(id);
    if (!leaderboard) return 0;
    if (!leaderboard.maxPP) return 0;

    return SSPPCalulator.getPP(leaderboard.maxPP, accuracy, failed);
  }

  /**
   *  Fetch a ScoreSaber leaderboard using ID
   * @param id ScoreSaber leaderboard ID
   * @returns ScoreSaber leaderboard data, if found
   */
  public async getLeaderboard(id: string): Promise<any> {
    return await this.fetch<any>(`v2/leaderboards/${id}`);
  }

  public async getMapFromHash(hash: string): Promise<any> {
    return await this.fetch<any>(`v2/maps/hash/${hash}`);
  }

  /**
   * Get maximum PP from ScoreSaber leaderboard
   * @param id ScoreSaber leaderboard ID
   * @returns ScoreSaber max PP
   */
  public async getRawPP(id: string): Promise<number> {
    const leaderboard = await this.getV1Leaderboard(id);
    if (!leaderboard) return 0;

    return leaderboard.maxPP;
  }

  /**
   * Fetch a ScoreSaber profile using ID
   * @param id - Profile ID
   * @returns ScoreSaber profile data, if found
   */
  public async getUserFromId(id: string | number): Promise<any> {
    return await this.fetch<any>(`v2/players/${id}/basic`);
  }

  /**
   * Fetch a ScoreSaber profile using BeatLeader linked IDs
   * @param linkedIds - BeatLeader linked IDs object
   * @returns ScoreSaber profile data, if found
   */
  public async getUserFromLinkedIds(linkedIds: LinkedIds): Promise<any> {
    for (const id of Object.values(linkedIds)) {
      if (id === undefined) continue;

      const user = await this.getUserFromId(id);
      if (user) return user;
    }
  }

  public async getUserFromRank(rank: number): Promise<any> {
    return (await this.fetch<any>(`v2/players?page=${rank}&limit=1`))?.data[0];
  }

  /**
   *  Fetch a ScoreSaber leaderboard using ID
   * @param id ScoreSaber leaderboard ID
   * @returns ScoreSaber leaderboard v1 data, if found
   */
  public async getV1Leaderboard(id: string): Promise<any> {
    return await this.fetch<any>(`v1/leaderboard/by-id${id}/info`);
  }

  /**
   *  Fetch a ScoreSaber leaderboard using map hash and difficulty
   * @param hash Map hash
   * @param difficulty Map difficulty
   * @returns ScoreSaber leaderboard v1 data, if found
   */
  public async getV1LeaderboardFromHash(
    hash: string,
    difficulty: number,
  ): Promise<any> {
    return await this.fetch<any>(
      `v1/leaderboard/by-hash/${hash}/info?difficulty=${difficulty}`,
    );
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

  private async fetch<T>(path: string): Promise<T | null> {
    const url = `https://scoresaber.com/api/${path}`;
    try {
      const res = await fetch(url);
      return res.ok ? (res.json() as T) : null;
    } catch (err) {
      console.warn(
        `[WARN]: ScoreSaber API: failed to fetch resource "${url}": ${err}`,
      );
      return null;
    }
  }

  private reconnectWebSocket() {
    setTimeout(() => {
      this._socket = new WebSocket("wss://scoresaber.com/ws");
      this.createListeners();
    }, 5000);
  }
}

export default new ScoreSaberApiService();
