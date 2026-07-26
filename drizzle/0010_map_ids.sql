ALTER TABLE "maps" ADD COLUMN "scoreSaberId" integer;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "beatLeaderId" varchar(32);--> statement-breakpoint
ALTER TABLE "maps" DROP COLUMN "leaderboardIds";--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_scoreSaberId_unique" UNIQUE("scoreSaberId");--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_beatLeaderId_unique" UNIQUE("beatLeaderId");