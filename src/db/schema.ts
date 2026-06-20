import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  varchar,
  doublePrecision,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

export const playersTable = pgTable("players", {
  // Primary ID (Discord)
  id: varchar({ length: 32 }).primaryKey().notNull(),

  // Connected Accounts
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

  // Rank history
  blRankHistory: jsonb().notNull(),
  ssRankHistory: jsonb().notNull(),
  asRankHistory: jsonb().notNull(),
  overallRankHistory: jsonb().notNull(),

  totalScores: integer().notNull().default(0),
});

export const scoresTable = pgTable("scores", {
  // Primary ID
  id: serial().primaryKey().notNull(),

  // Other identifiers
  playerId: varchar({ length: 32 }).notNull(),

  // Primary score data source
  provider: varchar({ length: 32 }).notNull(),

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
  ppBL: integer().notNull().default(0),
  ppSS: integer().notNull().default(0),
  ap: integer().notNull().default(0),
  modifiers: varchar({ length: 32 }).array(),

  // Leaderboard data
  blLeaderboardId: integer(),
  blScoreId: integer(),
  blRank: integer(),
  ssLeaderboardId: integer(),
  ssScoreId: integer(),
  ssRank: integer(),

  outdated: boolean().notNull(),
  timestamp: timestamp().notNull(),
});

export const scoreFeedsTable = pgTable("scorefeeds", {
  id: serial().primaryKey().notNull(),

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

export type PlayerRow = typeof playersTable.$inferSelect;
export type ScoreRow = typeof scoresTable.$inferSelect;
export type ScoreFeedRow = typeof scoreFeedsTable.$inferSelect;
