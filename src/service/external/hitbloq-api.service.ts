import EventEmitter from "events";

class HitBloqApiService extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Fetch a HitBloq profile using their ScoreSaber ID
   * @param scoreSaberId - ScoreSaber profile ID
   * @returns HitBloq ID
   */
  public async getUserFromScoreSaber(
    scoreSaberId: string | number,
  ): Promise<any> {
    const data = await this.fetch<any>(`tools/ss_to_hitbloq/${scoreSaberId}`);
    return data?.id ?? null;
  }

  private async fetch<T>(path: string): Promise<T | null> {
    const url = `https://hitbloq.com/api/${path}`;
    try {
      const res = await fetch(url);
      return res.ok ? (res.json() as T) : null;
    } catch (err) {
      console.warn(
        `[WARN]: HitBloq API: failed to fetch resource "${url}": ${err}`,
      );
      return null;
    }
  }
}

export default new HitBloqApiService();
