import { SSPPCalulator } from "../../common/ppcalculator.js";
import type { LinkedIds } from "./beatleader-api.service.js";
import { WebSocketClientService } from "../websocket/websocketclient.service.js";

class ScoreSaberApiService extends WebSocketClientService {
  constructor() {
    super("wss://scoresaber.com/ws");
  }

  public onMessage(data: any) {
    //this.emit(data.commandName, data.commandData);
  }

  /**
   * Estimate ScoreSaber PP
   * @param maxPP Leaderboard max PP
   * @param accuracy Score accuracy
   * @param failed Score failed value
   * @returns ScoreSaber PP value
   */
  public getPP(accuracy: number, stars: number, failed?: boolean) {
    return SSPPCalulator.getPP(accuracy, stars, failed);
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

  public async getPreciseStarValueFromScore(
    scoreId: string,
  ): Promise<Number | undefined> {
    const scoreData = await this.getScoreFromId(scoreId);
    if (!scoreData) return;

    const estimate = SSPPCalulator.getPPDetailed(
      scoreData.score.accuracy,
      scoreData.leaderboard.realm.stars,
    );

    return parseFloat(
      (
        (scoreData.score.pp * 10.685333512) /
        (450 * estimate.multiplier)
      ).toFixed(6),
    );
  }

  public async getPreciseStarValueFromLeaderboard(
    leaderboardId: string,
  ): Promise<Number | undefined> {
    const ssData = {
      score: await this.getTopLeaderboardScore(leaderboardId),
      leaderboard: await this.getLeaderboard(leaderboardId),
    };

    const estimate = SSPPCalulator.getPPDetailed(
      ssData.score.accuracy,
      ssData.leaderboard.realm.stars,
    );

    return parseFloat(
      ((ssData.score.pp * 10.685333512) / (450 * estimate.multiplier)).toFixed(
        6,
      ),
    );
  }

  public async getTopLeaderboardScore(leaderboardId: string) {
    return (
      await this.fetch<any>(`v2/leaderboards/${leaderboardId}/scores?limit=1`)
    )?.data[0];
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
   * Get ScoreSaber score
   * @param id ScoreSaber score ID
   * @returns ScoreSaber score data, if found
   */
  public async getScoreFromId(id: string): Promise<any> {
    return await this.fetch<any>(`v2/scores/${id}`);
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
    return await this.fetch<any>(`v1/leaderboard/by-id/${id}/info`);
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

  /**
   *  Fetch a ScoreSaber player's history
   * @param id Player ID
   * @returns ScoreSaber player history data, if found
   */
  public async getHistory(id: string, limit: number) {
    return await this.fetchReloaded<any>(`player/history/${id}?count=${limit}`);
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

  private async fetchReloaded<T>(path: string): Promise<T | null> {
    const url = `https://ssr-api.fascinated.cc/${path}`;
    try {
      const res = await fetch(url);
      return res.ok ? (res.json() as T) : null;
    } catch (err) {
      console.warn(
        `[WARN]: ScoreSaber API: failed to fetch resource from "${url}": ${err}`,
      );
      return null;
    }
  }
}

export default new ScoreSaberApiService();
