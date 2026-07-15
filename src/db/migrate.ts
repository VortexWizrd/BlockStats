import { migrate } from "drizzle-orm/node-postgres/migrator";
import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "./index.js";
import Player from "./convert/Player.js";
import { PlayerService } from "../service/player.service.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { PlayersRepository } from "../repositories/players/players.repository.js";
import mScore from "./convert/Score.js";
import mScoreFeed from "./convert/ScoreFeed.js";
import mRankFeed from "./convert/RankFeed.js";
import Score from "../common/score.js";
import { ScoreService } from "../service/score.service.js";
import { ScoreFeedService } from "../service/feeds/scorefeed.service.js";
import type ScoreFeed from "../common/feed/scorefeed.js";
import { RankFeedService } from "../service/feeds/rankfeed.service.js";
import type RankFeed from "../common/feed/rankfeed.js";
import { PlayerRankHistoriesRepository } from "../repositories/players/playerrankhistories.repository.js";
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
        let newUpVoteIds = [];
        let newDownVoteIds = [];
        for (const id of score.upVoteIds) {
          const playerId = (await PlayerService.getPlayerFromBeatLeader(id))
            ?.id;
          if (playerId) newUpVoteIds.push(playerId);
        }
        for (const id of score.downVoteIds) {
          const playerId = (await PlayerService.getPlayerFromBeatLeader(id))
            ?.id;
          if (playerId) newDownVoteIds.push(playerId);
        }
        migratedScore.playerId = score.discordId;
        migratedScore.upVoteIds = newUpVoteIds ?? [];
        migratedScore.downVoteIds = newDownVoteIds ?? [];
        const newScore = await ScoreService.createScore(migratedScore);
        console.log(newScore);
        if (newScore == undefined) continue;
        for (const message of score.messages) {
          console.log(
            await ScoreService.addDiscordMessage({
              id: newScore.id,
              messageId: message.messageId,
              type: message.userId ? "user" : "guild",
              channelId: message.channelId ?? null,
              userId: message.userId ?? null,
              guildId: message.guildId ?? null,
            }),
          );
        }
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

export async function generateRankHistory(): Promise<void> {
  const players = await PlayersRepository.getAll();
  if (!players) return;

  for (const player of players) {
    if (player.blRankHistory) {
      for (const rankTimestamp of player.blRankHistory) {
        try {
          if (
            await PlayerRankHistoriesRepository.findOne([
              { name: "provider", value: "BeatLeader" },
              { name: "playerId", value: player.id },
              {
                name: "timestamp",
                value: new Date(rankTimestamp.timestamp),
              },
              { name: "rank", value: rankTimestamp.rank },
            ])
          ) {
            continue;
          }

          console.log(rankTimestamp.timestamp);

          await PlayerRankHistoriesRepository.insert({
            provider: "BeatLeader",
            playerId: player.id,
            timestamp: new Date(rankTimestamp.timestamp),
            rank: rankTimestamp.rank,
          });
        } catch (err) {
          console.log(err);
          continue;
        }
      }
      await PlayersRepository.update(player.id, {
        blRank:
          (
            await PlayerRankHistoriesRepository.getLatestRow(
              player.id,
              "BeatLeader",
            )
          )?.rank ?? null,
      });
    }
    if (player.ssRankHistory) {
      for (const rankTimestamp of player.ssRankHistory) {
        try {
          if (
            await PlayerRankHistoriesRepository.findOne([
              { name: "provider", value: "ScoreSaber" },
              { name: "playerId", value: player.id },
              {
                name: "timestamp",
                value: new Date(rankTimestamp.timestamp),
              },
              { name: "rank", value: rankTimestamp.rank },
            ])
          ) {
            continue;
          }

          console.log(rankTimestamp.timestamp);

          await PlayerRankHistoriesRepository.insert({
            provider: "ScoreSaber",
            playerId: player.id,
            timestamp: new Date(rankTimestamp.timestamp),
            rank: rankTimestamp.rank,
          });
        } catch (err) {
          console.log(err);
          continue;
        }
      }
      await PlayersRepository.update(player.id, {
        ssRank:
          (
            await PlayerRankHistoriesRepository.getLatestRow(
              player.id,
              "ScoreSaber",
            )
          )?.rank ?? null,
      });
    }
  }
}
