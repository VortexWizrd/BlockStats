import EventEmitter from "events";
import { APCalculator } from "../../common/ppcalculator.js";

class BeatSaverApiService extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Fetch a BeatSaver map using hash
   * @param hash - Map hash
   * @returns BeatSaver map data, if found
   */
  public async getMapFromHash(hash: string) {
    return await this.fetch<any>(`maps/hash/${hash.toUpperCase()}`);
  }

  /**
   * Fetch a BeatSaver map using id
   * @param id - BeatSaver map ID
   * @returns BeatSaver map data, if found
   */
  public async getMapFromId(id: string) {
    return await this.fetch<any>(`maps/id/${id}`);
  }

  public getAP(complexity: number, acc: number): number {
    if (complexity == 0) return 0;
    return APCalculator.getAP(complexity, acc);
  }

  private async fetch<T>(path: string): Promise<T | null> {
    const url = `https://api.beatsaver.com/${path}`;
    try {
      const res = await fetch(url);
      return res.ok ? (res.json() as T) : null;
    } catch (err) {
      console.warn(
        `[WARN]: BeatSaver API: failed to fetch resource "${url}": ${err}`,
      );
      return null;
    }
  }
}

export default new BeatSaverApiService();
