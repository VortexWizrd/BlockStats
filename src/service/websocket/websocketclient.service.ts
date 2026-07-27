import EventEmitter from "events";
import { WebSocket } from "ws";

export class WebSocketClientService extends EventEmitter {
  private _socket: WebSocket | null = null;
  private _lastSocketUpdate: Date = new Date();
  private _intentionalClose = false;
  private _checkInterval: NodeJS.Timeout | null = null;
  private readonly _url: string;
  protected readonly checkDelay: number = 30;

  constructor(url: string) {
    super();
    this._url = url;
    this.connect();
    this.startHealthCheck();
  }

  public get connected(): boolean {
    return this._socket?.readyState === WebSocket.OPEN;
  }

  private connect() {
    this._intentionalClose = false;
    this._socket = new WebSocket(this._url);

    this._socket.on("open", () => {
      console.log(
        `[LOG]: ${this.constructor.name}: WebSocket connected successfully.`,
      );
      this._lastSocketUpdate = new Date();
    });

    this._socket.on("message", (message: WebSocket.RawData) => {
      try {
        const data = JSON.parse(message.toString());
        this.onMessage(data);
      } catch (err) {
        if (err instanceof SyntaxError) {
          console.error(
            `[ERROR]: ${this.constructor.name}: Failed to parse WebSocket message: Returned "${message}" which is not valid JSON`,
          );
        }
      }
      this._lastSocketUpdate = new Date();
    });

    this._socket.on("error", (err) => {
      console.error(
        `[ERROR]: ${this.constructor.name}: WebSocket error occurred: `,
        err.message,
      );
    });

    this._socket.on("close", (code, reason) => {
      console.warn(
        `[WARN]: ${this.constructor.name}: WebSocket closed (Code: ${code}, Reason: ${reason ?? "None"}).${!this._intentionalClose ? " Reconnecting..." : ""}`,
      );

      this.cleanupSocket();

      if (!this._intentionalClose) {
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect() {
    setTimeout(() => {
      if (!this.connected) {
        this.connect();
      }
    }, 5000);
  }

  private cleanupSocket() {
    if (this._socket) {
      this._socket.removeAllListeners();
      this._socket = null;
    }
  }

  private startHealthCheck() {
    this._checkInterval = setInterval(() => {
      const now = new Date();
      if (
        now.getTime() - this._lastSocketUpdate.getTime() >
        this.checkDelay * 2 * 1000
      ) {
        console.warn(
          `[WARN]: ${this.constructor.name}: No WebSocket updates in the last 60 seconds, reconnecting...`,
        );
        if (this._socket) {
          this._socket.terminate();
        } else {
          this.connect();
        }
      }
    }, this.checkDelay * 1000);
  }

  public onMessage(data: any) {
    if (data.type) {
      this.emit(data.type, data.data);
    }
    this._lastSocketUpdate = new Date();
  }

  public get lastSocketUpdate(): Date {
    return this._lastSocketUpdate;
  }

  public disconnect() {
    this._intentionalClose = true;
    if (this._checkInterval) clearInterval(this._checkInterval);
    if (this._socket) {
      this._socket.terminate();
      this.cleanupSocket();
    }
    console.log("[Socket] Disconnected intentionally.");
  }
}

export default new WebSocketClientService("ws://localhost:8081");
