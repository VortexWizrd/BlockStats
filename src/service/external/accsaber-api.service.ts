import EventEmitter from "events";
import { APCalculator } from "../../common/ppcalculator.js";

class AccSaberAPI extends EventEmitter {
  private _RankedMaps: any;

  constructor() {
    super();
  }

  public async getRankedMaps() {
    const data = await this.fetch<any>(
      `v1/maps/difficulties?page=0&size=1000&sort=rankedAt,desc&status=RANKED`,
    );
    return data.content;
  }

  /**
   * Fetch an AccSaber ranked map using hash
   * @param hash - Map hash
   * @returns AccSaber map data, if found
   */
  public async getMapFromHash(hash: string) {
    return await this.fetch<any>(`v1/maps/hash/${hash.toLowerCase()}`);
  }

  /**
   * Fetch an AccSaber ranked map using id
   * @param id - Map ID
   * @returns AccSaber map data, if found
   */
  public async getMapFromId(id: string) {
    return await this.fetch<any>(`v1/maps/${id}`);
  }

  public getComplexity(mapHash: string, difficulty: string): number {
    try {
      for (const map of this._RankedMaps) {
        if (
          map.songHash == mapHash &&
          map.difficulty.toLowerCase() == difficulty.toLowerCase()
        ) {
          return map.complexity;
        }
      }
      return 0;
    } catch (err) {
      console.log("Error: failed to fetch accsaber complexity: ", err);
      return 0;
    }
  }

  public getAP(complexity: number, acc: number): number {
    if (complexity == 0) return 0;
    return APCalculator.getAP(complexity, acc);
  }

  /**
   * Convert AccSaber category ID to its category code
   * @param id - Category id
   * @returns AccSaber category code (tech_acc, true_acc, standard_acc, etc.)
   */
  public getCategoryCodeFromId(id: string) {
    switch (id) {
      case "b0000000-0000-0000-0000-000000000001":
        return "true_acc";
      case "b0000000-0000-0000-0000-000000000002":
        return "standard_acc";
      case "b0000000-0000-0000-0000-000000000003":
        return "tech_acc";
      default:
        return "";
    }
  }
  private async fetch<T>(path: string): Promise<T | null> {
    const url = `https://api.accsaber.com/${path}`;
    try {
      const res = await fetch(url);
      return res.ok ? (res.json() as T) : null;
    } catch (err) {
      console.warn(
        `[WARN]: AccSaber API: failed to fetch resource "${url}": ${err}`,
      );
      return null;
    }
  }
}

export default new AccSaberAPI();
