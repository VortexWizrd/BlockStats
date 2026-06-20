import EventEmitter from "events";
import { WebSocket } from "ws";

class WebSocketClientService extends EventEmitter {
  private _socket = new WebSocket("ws://localhost:8081");
  private _lastSocketUpdate: Date = new Date();

  constructor() {
    super();

    // Listen to score uploads on websocket
    this._socket.addEventListener("message", (message: any) => {
      this.emit("score", JSON.parse(message.data));
      this._lastSocketUpdate = new Date();
    });

    // Listen to close / errors and reconnect
    this._socket.addEventListener("close", () => {
      this.reconnectWebSocket();
    });
    this._socket.addEventListener("error", () => {
      this.reconnectWebSocket();
    });

    // Wait for potential socket disconnects
    setInterval(() => {
      const now = new Date();

      if (now.getTime() - this._lastSocketUpdate.getTime() > 60000) {
        console.log(
          "[Socket] No updates in the last 60 seconds, reconnecting...",
        );
        this._socket.terminate();
      }
    }, 30000);
  }

  /** Get the last recorded BeatLeader socket update time */
  public get lastSocketUpdate(): Date {
    return this._lastSocketUpdate;
  }

  private reconnectWebSocket() {
    setTimeout(() => {
      this._socket = new WebSocket("wss://localhost:8081");
    }, 5000);
  }
}

export default new WebSocketClientService();
