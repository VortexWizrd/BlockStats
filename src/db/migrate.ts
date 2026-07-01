import { migrate } from "drizzle-orm/node-postgres/migrator";
import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "./index.js";
import Player from "./convert/Player.js";
import { PlayerService } from "../service/player.service.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { PlayersRepository } from "../repositories/players.repository.js";
import mScore from "./convert/Score.js";
import mScoreFeed from "./convert/ScoreFeed.js";
import mRankFeed from "./convert/RankFeed.js";
import Score from "../common/score.js";
import { ScoreService } from "../service/score.service.js";
import { ScoreFeedService } from "../service/scorefeed.service.js";
import type ScoreFeed from "../common/scorefeed.js";
import { RankFeedService } from "../service/rankfeed.service.js";
import type RankFeed from "../common/rankfeed.js";
dotenv.config();

function resolveMigrationsFolder(): string {
  const fromCwd = path.resolve(process.cwd(), "drizzle");
  console.log(fromCwd);
  if (existsSync(path.join(fromCwd, "meta", "_journal.json"))) {
    return fromCwd;
  }
  return path.join(import.meta.dirname, "..", "..", "drizzle");
}

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: resolveMigrationsFolder() }).catch(
    (error) => {
      throw error;
    },
  );
}

export async function migrateFromMongo(): Promise<void> {
  try {
    await mongoose.connect(String(process.env.MONGODB_URI));
    console.log("Connected to MongoDB");
    console.log("Starting migration from MongoDB...");
    console.log("Adding players...");
    const players = await Player.find();
    for (const player of players) {
      console.log(player.discordId);
      console.log(await PlayerService.createPlayer(player.discordId));
      console.log(
        await PlayersRepository.update(player.discordId, {
          blRankHistory: player.blRankHistory.map((rankHistory) => ({
            rank: rankHistory.rank,
            timestamp: rankHistory.timestamp,
          })),
          ssRankHistory: player.ssRankHistory.map((rankHistory) => ({
            rank: rankHistory.rank,
            timestamp: rankHistory.timestamp,
          })),
        }),
      );
      console.log("Finished player");
    }
    console.log("Finished adding players");
    console.log("Adding scores...");
    const scores = await mScore.find();
    for (const score of scores) {
      if (score.beatLeaderData) {
        if (!score.discordId) continue;
        const migratedScore = await Score.fromBeatLeader(score.beatLeaderData);
        migratedScore.playerId = score.discordId;
        migratedScore.upVoteIds = score.upVoteIds;
        migratedScore.downVoteIds = score.downVoteIds;
        migratedScore.messages = score.messages.map((message) => ({
          messageId: message.messageId,
          channelId: message.channelId ?? null,
          guildId: message.guildId ?? null,
          userId: message.userId ?? null,
        }));
        console.log(await ScoreService.createScore(migratedScore));
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else if (score.scoreSaberData) {
        if (!score.discordId) continue;
        const migratedScore = await Score.fromScoreSaber(score.scoreSaberData);
        migratedScore.playerId = score.discordId;
        console.log(await ScoreService.createScore(migratedScore));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    console.log("Finished adding scores");
    console.log("Adding score feeds...");
    const scoreFeeds = await mScoreFeed.find();
    for (const scoreFeed of scoreFeeds) {
      console.log(
        await ScoreFeedService.createScoreFeed({
          id: undefined,

          type: "default",
          channelType: scoreFeed.guildId ? "guild" : "user",
          displayType: "embed",

          userId: scoreFeed.userId ?? null,
          channelId: scoreFeed.channelId ?? null,
          guildId: scoreFeed.guildId ?? null,

          managerRoleId: null,

          playerIds: scoreFeed.beatleaderIds.map((id) => {
            if (id.startsWith("http")) {
              return id.split("/").pop();
            }
            return id;
          }),

          hasFilters: false,
          ssRanked: null,
          blRanked: null,
          asRanked: null,
          minRank: null,
        } as ScoreFeed),
      );
    }
    console.log("Finished adding score feeds");
    console.log("Adding rank feeds...");
    const rankFeeds = await mRankFeed.find();
    for (const rankFeed of rankFeeds) {
      console.log(
        await RankFeedService.createRankFeed({
          id: undefined,

          type: "default",
          channelType: rankFeed.guildId ? "guild" : "user",
          displayType: "embed",

          userId: rankFeed.userId ?? null,
          channelId: rankFeed.channelId ?? null,
          guildId: rankFeed.guildId ?? null,

          managerRoleId: null,

          playerIds: rankFeed.beatleaderIds.map((id) => {
            if (id.startsWith("http")) {
              return id.split("/").pop();
            }
            return id;
          }),

          hasFilters: false,
          ssRanked: null,
          blRanked: null,
          asRanked: null,
          minRank: null,
        } as RankFeed),
      );
    }
    console.log("Finished adding rank feeds");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
