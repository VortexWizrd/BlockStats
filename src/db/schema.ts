import {
  boolean,
  integer,
  pgTable,
  varchar,
  doublePrecision,
  timestamp,
  text,
  index,
  uuid,
  check,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// [[ Enums ]]
export const difficultyEnum = pgEnum("difficulty", [
  "Expert+",
  "Expert",
  "Hard",
  "Normal",
  "Easy",
]);
export const providerEnum = pgEnum("provider", [
  "BeatLeader",
  "ScoreSaber",
  "AccSaber",
  "AccSaber (Tech Acc)",
  "AccSaber (True Acc)",
  "AccSaber (Standard Acc)",
]);
export const voteEnum = pgEnum("vote", ["up", "down"]);
export const feedRequestEnum = pgEnum("feedrequest", [
  "open",
  "closed",
  "request",
]);

// [[ Tables ]]
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

    scoreSaberChange: boolean(),

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

    createdTime: timestamp().notNull().defaultNow(),
    updatedTime: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
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

export const playerRankHistoryTable = pgTable(
  "playerrankhistories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    playerId: varchar({ length: 32 })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    provider: providerEnum().notNull(),
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

export const playerPPHistoryTable = pgTable(
  "playerpphistories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    playerId: varchar({ length: 32 })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    provider: providerEnum().notNull(),
    timestamp: timestamp().notNull(),
    pp: doublePrecision().notNull(),
  },
  (table) => [
    check(
      "pphistory_pp_check",
      sql`
      (${table.pp} IS NULL OR ${table.pp} > 0)`,
    ),
    index("pphistory_timestamp_idx").on(table.timestamp),
    index("pphistory_rank_idx").on(table.pp),
  ],
);

export const scoresTable = pgTable(
  "scores",
  {
    // Primary ID
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Primary score data source
    provider: providerEnum().array().notNull(),

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
    songDifficulty: difficultyEnum().notNull(),
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
  },
  (table) => [
    index("scores_player_id_idx").on(table.playerId),
    index("scores_map_id_idx").on(table.mapId),
    index("scores_leaderboard_id_idx").on(table.leaderboardId),
    index("scores_song_hash_idx").on(table.songHash),
    index("scores_timestamp_idx").on(table.timestamp),
  ],
);

export const scoreVotesTable = pgTable(
  "scoreVotes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    scoreId: integer()
      .notNull()
      .references(() => scoresTable.id, { onDelete: "cascade" }),
    playerId: varchar({ length: 32 })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    voteType: voteEnum().notNull(),
    timestamp: timestamp().notNull().defaultNow(),
  },
  (table) => [unique("score_player_idx").on(table.scoreId, table.playerId)],
);

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

export const mapsTable = pgTable(
  "maps",
  {
    // map id
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    beatSaverId: varchar({ length: 32 }),
    hash: varchar({ length: 64 }).notNull().unique(),
    scoreSaberId: integer().unique(),
    beatLeaderId: varchar({ length: 32 }).unique(),

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

    // timestamps
    outdated: boolean().notNull().default(true),
    uploadedTime: timestamp(),
    savedTime: timestamp().notNull().defaultNow(),
    updatedTime: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("maps_hash_idx").on(table.hash),
    index("maps_beatsaver_idx").on(table.beatSaverId),
  ],
);

export const mapDownloadsTable = pgTable("mapdownloads", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  mapId: integer()
    .notNull()
    .references(() => mapsTable.id, {
      onDelete: "cascade",
    }),
  url: text().notNull(),
  uploaderId: varchar({ length: 32 })
    .notNull()
    .references(() => playersTable.id, {
      onDelete: "cascade",
    }),
  timestamp: timestamp().notNull().defaultNow(),
});

export const leaderboardsTable = pgTable(
  "leaderboards",
  {
    // leaderboard id
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    mapId: integer()
      .notNull()
      .references(() => mapsTable.id, {
        onDelete: "cascade",
      }),

    // leaderboard information
    difficulty: difficultyEnum().notNull(),
    customDifficultyName: text(),
    characteristic: varchar({ length: 128 }).notNull(),

    maxScore: integer().notNull().default(0),
    notes: integer(),
    bombs: integer(),
    obstacles: integer(),
    events: integer(),
    njs: doublePrecision(),
    offset: doublePrecision(),
    nps: doublePrecision(),

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

    outdated: boolean().notNull().default(true),
    savedTime: timestamp().notNull(),
    updatedTime: timestamp().notNull(),
  },
  (table) => [index("leaderboards_map_id_idx").on(table.mapId)],
);

// Feeds
const baseFeed = {
  // Basic feed information
  id: integer().primaryKey().generatedAlwaysAsIdentity().notNull(),
  type: varchar({ length: 32 }).notNull(),
  channelType: varchar({ length: 32 }).notNull(),
  displayType: varchar({ length: 32 }).notNull(),

  // Discord information
  userId: varchar({ length: 32 }),
  channelId: varchar({ length: 32 }),
  guildId: varchar({ length: 32 }),

  managerRoleId: varchar({ length: 32 }),
};

const playerFeed = {
  ...baseFeed,
  requestType: feedRequestEnum().notNull().default("closed"),

  playerIds: varchar({ length: 32 }).array().notNull(),

  hasFilters: boolean().notNull(),
  ssRanked: boolean(),
  blRanked: boolean(),
  asRanked: boolean(),
};

export const scoreFeedsTable = pgTable("scorefeeds", {
  ...playerFeed,

  minRank: integer(),
});

export const rankFeedsTable = pgTable("rankfeeds", {
  ...playerFeed,
});

export const snipeFeedsTable = pgTable("snipefeeds", {
  ...playerFeed,
  minRank: integer(),
});

export const ppFeedsTable = pgTable("ppFeeds", {
  ...playerFeed,
});

export type PlayerRow = typeof playersTable.$inferSelect;
export type ScoreRow = typeof scoresTable.$inferSelect;
export type ScoreMessageRow = typeof scoreMessagesTable.$inferInsert;
export type ScoreVoteRow = typeof scoreVotesTable.$inferInsert;
export type PlayerPPHistoryRow = typeof playerPPHistoryTable.$inferInsert;
export type ScoreFeedRow = typeof scoreFeedsTable.$inferSelect;
export type RankFeedRow = typeof rankFeedsTable.$inferSelect;
export type SnipeFeedRow = typeof snipeFeedsTable.$inferSelect;
export type PPFeedRow = typeof ppFeedsTable.$inferSelect;
export type PlayerRankHistoryRow = typeof playerRankHistoryTable.$inferSelect;
export type MapRow = typeof mapsTable.$inferInsert;
export type MapDownloadRow = typeof mapDownloadsTable.$inferInsert;
export type LeaderboardRow = typeof leaderboardsTable.$inferInsert;
