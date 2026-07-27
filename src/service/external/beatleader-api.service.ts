import { WebSocketClientService } from "../websocket/websocketclient.service.js";

export type LinkedIds = {
  steamId?: string;
  oculusPCId?: string;
  questId?: number;
};

class BeatLeaderApiService extends WebSocketClientService {
  constructor() {
    super("wss://sockets.api.beatleader.com/scores");
  }

  public onMessage(data: any) {
    this.emit("score", data);
  }

  public async getMapFromBeatSaverId(id: string): Promise<any> {
    return await this.fetch<any>(`leaderboard/${id}?page=1&count=0`);
  }

  /**
   * Fetch a BeatLeader profile using ID
   * @param id - BeatLeader profile ID
   * @returns BeatLeader profile data, if found
   */
  public async getUserFromId(id: string | number): Promise<any> {
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

  public async getUserFromRank(rank: number): Promise<any> {
    return (await this.fetch<any>(`players?sortBy=0&page=${rank}&count=1`))
      ?.data[0];
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
}

export default new BeatLeaderApiService();
