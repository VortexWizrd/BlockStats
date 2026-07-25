DO $$ BEGIN
    CREATE TYPE "public"."feedrequest" AS ENUM('open', 'closed', 'request');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TYPE "public"."provider" ADD VALUE 'AccSaber';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TYPE "public"."provider" ADD VALUE 'AccSaber (Tech Acc)';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TYPE "public"."provider" ADD VALUE 'AccSaber (True Acc)';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TYPE "public"."provider" ADD VALUE 'AccSaber (Standard Acc)';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

COMMIT;
BEGIN;
CREATE TABLE "playerpphistories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "playerpphistories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"playerId" varchar(32) NOT NULL,
	"provider" "provider" NOT NULL,
	"timestamp" timestamp NOT NULL,
	"pp" double precision NOT NULL,
	CONSTRAINT "pphistory_pp_check" CHECK (
      ("playerpphistories"."pp" IS NULL OR "playerpphistories"."pp" > 0))
);
--> statement-breakpoint
CREATE TABLE "ppFeeds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ppFeeds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" varchar(32) NOT NULL,
	"channelType" varchar(32) NOT NULL,
	"displayType" varchar(32) NOT NULL,
	"userId" varchar(32),
	"channelId" varchar(32),
	"guildId" varchar(32),
	"managerRoleId" varchar(32),
	"requestType" "feedrequest" NOT NULL,
	"playerIds" varchar(32)[] NOT NULL,
	"hasFilters" boolean NOT NULL,
	"ssRanked" boolean,
	"blRanked" boolean,
	"asRanked" boolean
);
--> statement-breakpoint
ALTER TABLE "playerrankhistories" ALTER COLUMN "provider" SET DATA TYPE "public"."provider" USING "provider"::"public"."provider";--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "outdated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "outdated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "rankfeeds" ADD COLUMN "requestType" "feedrequest" DEFAULT 'closed' NOT NULL;--> statement-breakpoint
ALTER TABLE "scorefeeds" ADD COLUMN "requestType" "feedrequest" DEFAULT 'closed' NOT NULL;--> statement-breakpoint
ALTER TABLE "snipefeeds" ADD COLUMN "requestType" "feedrequest" DEFAULT 'closed' NOT NULL;--> statement-breakpoint
ALTER TABLE "playerpphistories" ADD CONSTRAINT "playerpphistories_playerId_players_id_fk" FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pphistory_timestamp_idx" ON "playerpphistories" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "pphistory_rank_idx" ON "playerpphistories" USING btree ("pp");--> statement-breakpoint
ALTER TABLE "rankfeeds" DROP COLUMN "minRank";