import express, { type Request, type Response } from "express";
import { startDiscord } from "./discord/index.js";
import { runMigrations } from "./db/migrate.js";
import websocketserverService from "./service/websocket/websocketserver.service.js";

const app = express();
const port = 8000;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World" });
});

app.listen(port, () => {
  console.log("Server listening on port " + port);
});

await runMigrations();

startDiscord();
