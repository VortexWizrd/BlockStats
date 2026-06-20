import EventEmitter from "events";
import { WebSocket } from "ws";

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
    try {
      const response = await fetch(
        `https://hitbloq.com/api/tools/ss_to_hitbloq/${scoreSaberId}`,
      );
      const data: any = await response.json();
      return data.id;
    } catch (error) {
      console.log("Error getting HitBloq ID: " + error);
      return undefined;
    }
  }
}

export default new HitBloqApiService();
