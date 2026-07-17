import {
  boolean,
  integer,
  jsonb,
  pgTable,
  varchar,
  doublePrecision,
  timestamp,
  text,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { type RankHistory } from "../common/player.js";

export const playersTable = pgTable("players", {
  // Primary ID (Discord)
  id: varchar({ length: 32 }).primaryKey().notNull(),

  // Connected Accounts
  beatLeaderId: varchar({ length: 32 }),
  steamId: varchar({ length: 32 }),
  oculusId: varchar({ length: 32 }),
  questId: integer(),
  alias: varchar({ length: 32 }),

  scoreSaberId: varchar({ length: 32 }),
  scoreSaberAlias: varchar({ length: 32 }),

  accSaberId: varchar({ length: 32 }),

  hitBloqId: integer(),

  // Profile data
  name: text().notNull(),
  avatar: text().notNull().default(""),

  // Rank history (to be removed)
  blRankHistory: jsonb().$type<RankHistory>(),
  ssRankHistory: jsonb().$type<RankHistory>(),
  asRankHistory: jsonb().$type<RankHistory>(),
  overallRankHistory: jsonb().$type<RankHistory>(),

  // Rank
  blRank: integer(),
  ssRank: integer(),
  asRank: integer(),
  overallRank: integer(),

  totalScores: integer().notNull().default(0),
});

export const scoresTable = pgTable("scores", {
  // Primary ID
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Other identifiers
  playerId: varchar({ length: 32 }).notNull(),

  // Primary score data source
  provider: varchar({ length: 32 }).array().notNull(),

  // Player basic information
  playerName: text().notNull().default(""),
  playerAvatar: text().notNull().default(""),

  // Map data
  songName: text().notNull().default(""),
  songSubname: text().notNull().default(""),
  songAuthor: text().notNull().default(""),
  songCover: text().notNull().default(""),
  mapAuthor: text().notNull().default(""),
  songHash: varchar({ length: 64 }).notNull(),
  songDifficulty: varchar({ length: 64 }).notNull(),
  songCharacteristic: varchar({ length: 128 }).notNull(),

  // Score data
  score: integer().notNull(),
  accuracy: doublePrecision().notNull(),
  fullCombo: boolean().notNull(),
  missedNotes: integer().notNull(),
  badCuts: integer().notNull(),
  bombHits: integer(),
  wallHits: integer(),
  ppBL: doublePrecision().notNull().default(0),
  ppSS: doublePrecision().notNull().default(0),
  ap: doublePrecision().notNull().default(0),
  modifiers: varchar({ length: 32 }).array(),
  improvement: doublePrecision(),

  // Leaderboard data
  blLeaderboardId: varchar({ length: 32 }),
  blScoreId: integer(),
  blStarRating: doublePrecision(),
  blRank: integer(),
  ssLeaderboardId: integer(),
  ssScoreId: integer(),
  ssStarRating: doublePrecision(),
  ssRank: integer(),

  outdated: boolean().notNull(),
  timestamp: timestamp().notNull(),

  // Discord data
  messages: jsonb(),
  upVoteIds: varchar({ length: 32 }).array().notNull(),
  downVoteIds: varchar({ length: 32 }).array().notNull(),
});

export const scoreMessagesTable = pgTable("scoremessages", {
  id: integer().notNull(),
  type: varchar({ length: 32 }).notNull(),
  messageId: varchar({ length: 32 }).primaryKey().notNull(),
  userId: varchar({ length: 32 }),
  channelId: varchar({ length: 32 }),
  guildId: varchar({ length: 32 }),
});

export const scoreFeedsTable = pgTable("scorefeeds", {
  id: integer().primaryKey().generatedAlwaysAsIdentity().notNull(),

  type: varchar({ length: 32 }).notNull(),
  channelType: varchar({ length: 32 }).notNull(),
  displayType: varchar({ length: 32 }).notNull(),

  userId: varchar({ length: 32 }),
  channelId: varchar({ length: 32 }),
  guildId: varchar({ length: 32 }),

  managerRoleId: varchar({ length: 32 }),

  playerIds: varchar({ length: 32 }).array().notNull(),

  hasFilters: boolean().notNull(),
  ssRanked: boolean(),
  blRanked: boolean(),
  asRanked: boolean(),
  minRank: integer(),
});

export const rankFeedsTable = pgTable("rankfeeds", {
  id: integer().primaryKey().generatedAlwaysAsIdentity().notNull(),

  type: varchar({ length: 32 }).notNull(),
  channelType: varchar({ length: 32 }).notNull(),
  displayType: varchar({ length: 32 }).notNull(),

  userId: varchar({ length: 32 }),
  channelId: varchar({ length: 32 }),
  guildId: varchar({ length: 32 }),

  managerRoleId: varchar({ length: 32 }),

  playerIds: varchar({ length: 32 }).array().notNull(),

  hasFilters: boolean().notNull(),
  ssRanked: boolean(),
  blRanked: boolean(),
  asRanked: boolean(),
  minRank: integer(),
});

export const snipeFeedsTable = pgTable("snipefeeds", {
  id: integer().primaryKey().generatedAlwaysAsIdentity().notNull(),

  type: varchar({ length: 32 }).notNull(),
  channelType: varchar({ length: 32 }).notNull(),
  displayType: varchar({ length: 32 }).notNull(),

  userId: varchar({ length: 32 }),
  channelId: varchar({ length: 32 }),
  guildId: varchar({ length: 32 }),

  managerRoleId: varchar({ length: 32 }),

  playerIds: varchar({ length: 32 }).array().notNull(),

  hasFilters: boolean().notNull(),
  ssRanked: boolean(),
  blRanked: boolean(),
  asRanked: boolean(),
  minRank: integer(),
});

export const playerRankHistoryTable = pgTable(
  "playerrankhistories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    playerId: varchar({ length: 32 }).notNull(),
    provider: varchar({ length: 32 }).notNull(),
    timestamp: timestamp().notNull(),
    rank: integer().notNull(),
  },
  (table) => [
    index("rankhistory_timestamp_idx").on(table.timestamp),
    index("rankhistory_rank_idx").on(table.rank),
  ],
);

export const mapsTable = pgTable("maps", {
  // map id
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  beatSaverId: varchar({ length: 32 }),
  hash: varchar({ length: 64 }).notNull(),

  // map information
  songName: text().notNull(),
  songSubName: text().notNull(),
  songAuthor: text().notNull(),
  mapAuthor: text().notNull(),
  songCover: text().notNull(),

  leaderboardIds: integer().array().notNull(),

  savedTime: timestamp().notNull(),
  updatedTime: timestamp().notNull(),
});

export const leaderboardsTable = pgTable("leaderboards", {
  // leaderboard id
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  mapId: integer().notNull(),

  // leaderboard information
  difficulty: varchar({ length: 64 }).notNull(),
  characteristic: varchar({ length: 128 }).notNull(),

  // beatleader
  blLeaderboardId: varchar({ length: 32 }),
  blRankedStatus: varchar({ length: 32 }),
  blStarRating: doublePrecision(),
  blTechRating: doublePrecision(),
  blAccRating: doublePrecision(),
  blPassRating: doublePrecision(),

  // scoresaber
  ssLeaderboardId: integer(),
  ssRankedStatus: varchar({ length: 32 }),
  ssStarRating: doublePrecision(),

  // accsaber
  asLeaderboardId: uuid(),
  asRankedStatus: varchar({ length: 32 }),
  asCategoryId: uuid(),
  asCategoryCode: varchar({ length: 32 }),
  asComplexity: doublePrecision(),

  savedTime: timestamp().notNull(),
  updatedTime: timestamp().notNull(),
});

export type PlayerRow = typeof playersTable.$inferSelect;
export type ScoreRow = typeof scoresTable.$inferSelect;
export type ScoreMessageRow = typeof scoreMessagesTable.$inferInsert;
export type ScoreFeedRow = typeof scoreFeedsTable.$inferSelect;
export type RankFeedRow = typeof rankFeedsTable.$inferSelect;
export type SnipeFeedRow = typeof snipeFeedsTable.$inferSelect;
export type PlayerRankHistoryRow = typeof playerRankHistoryTable.$inferSelect;
export type MapRow = typeof mapsTable.$inferInsert;
export type LeaderboardRow = typeof leaderboardsTable.$inferInsert;
