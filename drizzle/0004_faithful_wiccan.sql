DELETE FROM "scores" 
WHERE "playerId" NOT IN (SELECT "id" FROM "players");--> statement-breakpoint
DELETE FROM "scoremessages" 
WHERE "id" NOT IN (SELECT "id" FROM "scores");--> statement-breakpoint
DELETE FROM "playerrankhistories" 
WHERE "rank" <= 0;--> statement-breakpoint
UPDATE "players" 
SET "blRank" = NULL
WHERE "blRank" <= 0;--> statement-breakpoint
UPDATE "players" 
SET "ssRank" = NULL
WHERE "ssRank" <= 0;--> statement-breakpoint
UPDATE "players" 
SET "asRank" = NULL
WHERE "asRank" <= 0;--> statement-breakpoint
ALTER TABLE "scores" RENAME COLUMN "songSubname" TO "songSubName";--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "playerId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "maxScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "ssMaxPP" double precision;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "songDescription" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "songDuration" integer;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "songBPM" double precision;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "uploadedTime" timestamp;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "beatSaverId" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "accentColor" varchar(7);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "status" varchar(32);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asTechRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asTrueRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asStandardRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blTechPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blPassPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blAccPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ssPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asTechPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asTruePP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asStandardPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "overallPP" double precision;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "lastScoreTime" timestamp;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "createdTime" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "updatedTime" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "playerBeatLeaderId" varchar(32);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "playerScoreSaberId" varchar(32);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "mapId" integer;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "leaderboardId" integer;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "blModifiedStarRating" double precision;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "ssMaxPP" double precision;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "asLeaderboardId" uuid;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "asComplexity" double precision;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "asCategoryCode" varchar(32);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "maxScore" integer;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "upVotes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "downVotes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_mapId_players_id_fk" FOREIGN KEY ("mapId") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playerrankhistories" ADD CONSTRAINT "playerrankhistories_playerId_players_id_fk" FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoremessages" ADD CONSTRAINT "scoremessages_id_scores_id_fk" FOREIGN KEY ("id") REFERENCES "public"."scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_playerId_players_id_fk" FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_mapId_maps_id_fk" FOREIGN KEY ("mapId") REFERENCES "public"."maps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_leaderboardId_leaderboards_id_fk" FOREIGN KEY ("leaderboardId") REFERENCES "public"."leaderboards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "blRankHistory";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "ssRankHistory";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "asRankHistory";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "overallRankHistory";--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "messages";--> statement-breakpoint
ALTER TABLE "playerrankhistories" ADD CONSTRAINT "rankhistory_rank_check" CHECK (
      ("playerrankhistories"."rank" IS NULL OR "playerrankhistories"."rank" > 0));--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "player_accent_color_check" CHECK ("players"."accentColor" IS NULL OR "players"."accentColor" ~ '^#[0-9a-fA-F]{6}$');--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "player_rank_check" CHECK (
      ("players"."blRank" IS NULL OR "players"."blRank" > 0) AND
    ("players"."ssRank" IS NULL OR "players"."ssRank" > 0) AND
    ("players"."asRank" IS NULL OR "players"."asRank" > 0) AND
    ("players"."asTechRank" IS NULL OR "players"."asTechRank" > 0) AND
    ("players"."asTrueRank" IS NULL OR "players"."asTrueRank" > 0) AND
    ("players"."asStandardRank" IS NULL OR "players"."asStandardRank" > 0) AND
    ("players"."overallRank" IS NULL OR "players"."overallRank" > 0)
    );--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "pp_check" CHECK (
      ("players"."blPP" IS NULL OR "players"."blPP" > 0) AND
      ("players"."blTechPP" IS NULL OR "players"."blTechPP" > 0) AND
      ("players"."blPassPP" IS NULL OR "players"."blPassPP" > 0) AND
      ("players"."blAccPP" IS NULL OR "players"."blAccPP" > 0) AND
      ("players"."ssPP" IS NULL OR "players"."ssPP" > 0) AND
      ("players"."asPP" IS NULL OR "players"."asPP" > 0) AND
      ("players"."asTechPP" IS NULL OR "players"."asTechPP" > 0) AND
      ("players"."asTruePP" IS NULL OR "players"."asTruePP" > 0) AND
      ("players"."asStandardPP" IS NULL OR "players"."asStandardPP" > 0) AND
      ("players"."overallPP" IS NULL OR "players"."overallPP" > 0)
    );