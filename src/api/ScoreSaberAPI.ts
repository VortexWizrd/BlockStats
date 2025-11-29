import EventEmitter from "events";
import ReconnectingWebSocket from "reconnecting-websocket";

class ScoreSaberAPI extends EventEmitter {
    private _socket = new ReconnectingWebSocket("wss://scoresaber.com/ws");
    private _lastSocketUpdate: Date = new Date();

    constructor() {
        super();

        // Listen to score uploads on websocket
        this._socket.addEventListener("message", (message) => {
            if (message.data == "Connected to the ScoreSaber WSS") return;
            const messageData = JSON.parse(message.data);
            if (messageData.commandName !== "score") return;
            this.emit("score", messageData.commandData);
            this._lastSocketUpdate = new Date();
        });
    }

    public get lastSocketUpdate(): Date {
        return this._lastSocketUpdate;
    }
}

export default new ScoreSaberAPI();
