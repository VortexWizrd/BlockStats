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
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const playersTable = pgTable(
  "players",
  {
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
    beatSaverId: integer(),

    // Profile data
    name: text().notNull(),
    avatar: text().notNull().default(""),
    accentColor: varchar({ length: 7 }),
    status: varchar({ length: 32 }),

    // Rank
    blRank: integer(),
    ssRank: integer(),
    asRank: integer(),
    asTechRank: integer(),
    asTrueRank: integer(),
    asStandardRank: integer(),
    overallRank: integer(),

    // PP
    blPP: doublePrecision(),
    blTechPP: doublePrecision(),
    blPassPP: doublePrecision(),
    blAccPP: doublePrecision(),
    ssPP: doublePrecision(),
    asPP: doublePrecision(),
    asTechPP: doublePrecision(),
    asTruePP: doublePrecision(),
    asStandardPP: doublePrecision(),
    overallPP: doublePrecision(),

    totalScores: integer().notNull().default(0),

    lastScoreTime: timestamp(),

    createdTime: timestamp().notNull(),
    updatedTime: timestamp().notNull(),
  },
  (table) => [
    check(
      "player_accent_color_check",
      sql`${table.accentColor} IS NULL OR ${table.accentColor} ~ '^#[0-9a-fA-F]{6}$'`,
    ),
    check(
      "player_rank_check",
      sql`
      (${table.blRank} IS NULL OR ${table.blRank} > 0) AND
    (${table.ssRank} IS NULL OR ${table.ssRank} > 0) AND
    (${table.asRank} IS NULL OR ${table.asRank} > 0) AND
    (${table.asTechRank} IS NULL OR ${table.asTechRank} > 0) AND
    (${table.asTrueRank} IS NULL OR ${table.asTrueRank} > 0) AND
    (${table.asStandardRank} IS NULL OR ${table.asStandardRank} > 0) AND
    (${table.overallRank} IS NULL OR ${table.overallRank} > 0)
    `,
    ),
    check(
      "pp_check",
      sql`
      (${table.blPP} IS NULL OR ${table.blPP} > 0) AND
      (${table.blTechPP} IS NULL OR ${table.blTechPP} > 0) AND
      (${table.blPassPP} IS NULL OR ${table.blPassPP} > 0) AND
      (${table.blAccPP} IS NULL OR ${table.blAccPP} > 0) AND
      (${table.ssPP} IS NULL OR ${table.ssPP} > 0) AND
      (${table.asPP} IS NULL OR ${table.asPP} > 0) AND
      (${table.asTechPP} IS NULL OR ${table.asTechPP} > 0) AND
      (${table.asTruePP} IS NULL OR ${table.asTruePP} > 0) AND
      (${table.asStandardPP} IS NULL OR ${table.asStandardPP} > 0) AND
      (${table.overallPP} IS NULL OR ${table.overallPP} > 0)
    `,
    ),
  ],
);

export const scoresTable = pgTable("scores", {
  // Primary ID
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Primary score data source
  provider: varchar({ length: 32 }).array().notNull(),

  // Player Information
  playerId: varchar({ length: 32 }).references(() => playersTable.id, {
    onDelete: "set null",
  }),
  playerBeatLeaderId: varchar({ length: 32 }),
  playerScoreSaberId: varchar({ length: 32 }),
  playerName: text().notNull().default(""),
  playerAvatar: text().notNull().default(""),

  // Map data
  mapId: integer().references(() => mapsTable.id, {
    onDelete: "set null",
  }),
  songName: text().notNull().default(""),
  songSubName: text().notNull().default(""),
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
  leaderboardId: integer().references(() => leaderboardsTable.id, {
    onDelete: "set null",
  }),
  blLeaderboardId: varchar({ length: 32 }),
  blScoreId: integer(),
  blStarRating: doublePrecision(),
  blModifiedStarRating: doublePrecision(),
  blRank: integer(),
  ssLeaderboardId: integer(),
  ssScoreId: integer(),
  ssStarRating: doublePrecision(),
  ssMaxPP: doublePrecision(),
  ssRank: integer(),
  asLeaderboardId: uuid(),
  asComplexity: doublePrecision(),
  asCategoryCode: varchar({ length: 32 }),

  maxScore: integer(),

  outdated: boolean().notNull(),
  timestamp: timestamp().notNull(),

  // Discord data
  upVotes: integer().notNull().default(0),
  downVotes: integer().notNull().default(0),
  upVoteIds: varchar({ length: 32 }).array().notNull(),
  downVoteIds: varchar({ length: 32 }).array().notNull(),
});

export const scoreMessagesTable = pgTable("scoremessages", {
  id: integer()
    .notNull()
    .references(() => scoresTable.id, { onDelete: "cascade" }),
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
    playerId: varchar({ length: 32 })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    provider: varchar({ length: 32 }).notNull(),
    timestamp: timestamp().notNull(),
    rank: integer().notNull(),
  },
  (table) => [
    check(
      "rankhistory_rank_check",
      sql`
      (${table.rank} IS NULL OR ${table.rank} > 0)`,
    ),
    index("rankhistory_timestamp_idx").on(table.timestamp),
    index("rankhistory_rank_idx").on(table.rank),
  ],
);

export const mapsTable = pgTable("maps", {
  // map id
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  beatSaverId: varchar({ length: 32 }),
  hash: varchar({ length: 64 }).notNull(),

  // map basic information
  songName: text().notNull(),
  songSubName: text().notNull(),
  songAuthor: text().notNull(),
  mapAuthor: text().notNull(),
  songCover: text().notNull(),
  songDescription: text().notNull().default(""),

  // detailed information
  songDuration: integer(),
  songBPM: doublePrecision(),

  // leaderboards
  leaderboardIds: integer().array().notNull(),

  // timestamps
  uploadedTime: timestamp(),
  savedTime: timestamp().notNull().defaultNow(),
  updatedTime: timestamp().notNull().defaultNow(),
});

export const leaderboardsTable = pgTable("leaderboards", {
  // leaderboard id
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  mapId: integer()
    .notNull()
    .references(() => mapsTable.id, {
      onDelete: "cascade",
    }),

  // leaderboard information
  difficulty: varchar({ length: 64 }).notNull(),
  characteristic: varchar({ length: 128 }).notNull(),

  maxScore: integer().notNull().default(0),

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
  ssMaxPP: doublePrecision(),

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
