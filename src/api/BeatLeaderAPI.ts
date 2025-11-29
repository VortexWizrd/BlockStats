import EventEmitter from "events";
import ReconnectingWebSocket from "reconnecting-websocket";

class BeatLeaderAPI extends EventEmitter {
    private _socket = new ReconnectingWebSocket(
        "wss://sockets.api.beatleader.com/scores"
    );
    private _lastSocketUpdate: Date = new Date();

    constructor() {
        super();

        // Listen to score uploads on websocket
        this._socket.addEventListener("message", (message) => {
            this.emit("score", JSON.parse(message.data));
            this._lastSocketUpdate = new Date();
        });
    }

    public get lastSocketUpdate(): Date {
        return this._lastSocketUpdate;
    }

    public async getUserFromDiscord(discordId: string | number): Promise<any> {
        try {
            const response = await fetch(
                `https://api.beatleader.com/player/discord/${discordId}`,
                {}
            );
            return response.json();
        } catch (error) {
            console.log(
                "Error fetching BeatLeader user from Discord ID: " + error
            );
            return;
        }
    }

    public async getScoreStatistic(scoreId: string | number): Promise<any> {
        try {
            const response = await fetch(
                `https://api.beatleader.com/score/statistic/${scoreId}`,
                {}
            );
            return response.json();
        } catch (error) {
            console.log("Error fetching BeatLeader score statistic: " + error);
            return;
        }
    }
}

export default new BeatLeaderAPI();
