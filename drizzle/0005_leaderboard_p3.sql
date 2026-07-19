DELETE FROM "leaderboards" 
WHERE "difficulty" NOT IN ('Easy', 'Normal', 'Hard', 'Expert', 'Expert+');
DELETE FROM "scores" 
WHERE "songDifficulty" NOT IN ('Easy', 'Normal', 'Hard', 'Expert', 'Expert+');

CREATE TYPE "public"."difficulty" AS ENUM('Expert+', 'Expert', 'Hard', 'Normal', 'Easy');--> statement-breakpoint
ALTER TABLE "leaderboards" DROP CONSTRAINT "leaderboards_mapId_players_id_fk";
--> statement-breakpoint
ALTER TABLE "leaderboards" ALTER COLUMN "difficulty" SET DATA TYPE "public"."difficulty" USING "difficulty"::"public"."difficulty";--> statement-breakpoint
ALTER TABLE "maps" ALTER COLUMN "songDescription" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "maps" ALTER COLUMN "savedTime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "maps" ALTER COLUMN "updatedTime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "songDifficulty" SET DATA TYPE "public"."difficulty" USING "songDifficulty"::"public"."difficulty";--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "upVotes" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "downVotes" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "customDifficultyName" text;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "notes" integer;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "bombs" integer;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "obstacles" integer;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "events" integer;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "njs" double precision;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "offset" double precision;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD COLUMN "nps" double precision;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_mapId_maps_id_fk" FOREIGN KEY ("mapId") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;