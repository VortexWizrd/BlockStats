import EventEmitter from "events";
import { APCalculator } from "../../common/ppcalculator.js";

class AccSaberAPI extends EventEmitter {
  private _RankedMaps: any;

  constructor() {
    super();

    // Fetch AccSaber ranked maps (will make it periodically when im not lazy)
    this.getRankedMaps();
  }

  public async getRankedMaps() {
    try {
      const response = await fetch(
        `https://api.accsaber.com/v1/maps/difficulties?page=0&size=1000&sort=rankedAt,desc&status=RANKED`,
        {},
      );
      const data: any = await response.json();
      this._RankedMaps = data.content;
    } catch (err) {
      console.log("Failed to get AccSaber ranked maps: ", err);
    }
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
}

export default new AccSaberAPI();
