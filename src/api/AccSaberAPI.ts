import EventEmitter from "events";
import ReconnectingWebSocket from "reconnecting-websocket";
import { getAccSaberAP } from "../utils/calculatePP";

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
                `https://api.accsaber.com/ranked-maps`,
                {}
            );
            this._RankedMaps = response.json();
        } catch (err) {
            console.log("Failed to get AccSaber ranked maps: ", err);
        }
    }

    public getComplexity(mapHash: string): number {
        try {
            for (const map of this._RankedMaps) {
                if (map.songHash == mapHash) {
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
        return getAccSaberAP(complexity, acc)
    }
}

export default new AccSaberAPI();
