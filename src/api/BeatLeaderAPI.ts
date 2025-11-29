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
}

export default new BeatLeaderAPI();
