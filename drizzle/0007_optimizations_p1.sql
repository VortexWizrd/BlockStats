CREATE TYPE "public"."provider" AS ENUM('BeatLeader', 'ScoreSaber');--> statement-breakpoint
CREATE TYPE "public"."vote" AS ENUM('up', 'down');--> statement-breakpoint

CREATE TABLE "scoreVotes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scoreVotes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"scoreId" integer NOT NULL,
	"playerId" varchar(32) NOT NULL,
	"voteType" "vote" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "score_player_idx" UNIQUE("scoreId","playerId")
);
--> statement-breakpoint

ALTER TABLE "scoreVotes" ADD CONSTRAINT "scoreVotes_scoreId_scores_id_fk" FOREIGN KEY ("scoreId") REFERENCES "public"."scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoreVotes" ADD CONSTRAINT "scoreVotes_playerId_players_id_fk" FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

INSERT INTO "scoreVotes" ("scoreId", "playerId", "voteType", "timestamp")
SELECT 
    s.id AS "scoreId",
    p_id AS "playerId",
    'up' AS "voteType",
    CURRENT_TIMESTAMP AS "timestamp"
FROM "scores" s,
LATERAL unnest(s."upVoteIds"::text[]) AS p_id
ON CONFLICT DO NOTHING;
INSERT INTO "scoreVotes" ("scoreId", "playerId", "voteType", "timestamp")
SELECT 
    s.id AS "scoreId",
    p_id AS "playerId",
    'down' AS "voteType",
    CURRENT_TIMESTAMP AS "timestamp"
FROM "scores" s,
LATERAL unnest(s."downVoteIds"::text[]) AS p_id
ON CONFLICT DO NOTHING;


ALTER TABLE "players" ALTER COLUMN "createdTime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "updatedTime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "provider" SET DATA TYPE "public"."provider"[] USING "provider"::"public"."provider"[];--> statement-breakpoint
CREATE INDEX "leaderboards_map_id_idx" ON "leaderboards" USING btree ("mapId");--> statement-breakpoint
CREATE INDEX "maps_hash_idx" ON "maps" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "maps_beatsaver_idx" ON "maps" USING btree ("beatSaverId");--> statement-breakpoint
CREATE INDEX "scores_player_id_idx" ON "scores" USING btree ("playerId");--> statement-breakpoint
CREATE INDEX "scores_map_id_idx" ON "scores" USING btree ("mapId");--> statement-breakpoint
CREATE INDEX "scores_leaderboard_id_idx" ON "scores" USING btree ("leaderboardId");--> statement-breakpoint
CREATE INDEX "scores_song_hash_idx" ON "scores" USING btree ("songHash");--> statement-breakpoint
CREATE INDEX "scores_timestamp_idx" ON "scores" USING btree ("timestamp");--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "upVoteIds";--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "downVoteIds";