import express, { type Request, type Response } from "express";
import { startDiscord } from "./discord/index.js";
import {
  generateRankHistory,
  migrateFromMongo,
  runMigrations,
} from "./db/migrate.js";
import websocketserverService from "./service/websocket/websocketserver.service.js";
import { PlayerService } from "./service/player.service.js";

const app = express();
const port = 8000;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World" });
});

app.listen(port, () => {
  console.log("Server listening on port " + port);
});

await runMigrations();
await generateRankHistory();
// await migrateFromMongo();

startDiscord();

await PlayerService.updateAllPlayerLinks();
