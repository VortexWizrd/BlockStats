import express, { type Request, type Response } from "express";
import { startDiscord } from "./discord/index.js";
import {
  migrateFromMongo,
  runMigrations,
  setOutdatedScores,
} from "./db/migrate.js";
import websocketserverService from "./service/websocket/websocketserver.service.js";
import { PlayerService } from "./service/player.service.js";
import { MapService } from "./service/map.service.js";
import { ScoresRepository } from "./repositories/scores.repository.js";

const app = express();
const port = 8000;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World" });
});

app.listen(port, () => {
  console.log("Server listening on port " + port);
});

await runMigrations();
await setOutdatedScores();
//await MapService.createAccSaberRankedMaps(); // temp
await ScoresRepository.fixDifficulties();

startDiscord();
