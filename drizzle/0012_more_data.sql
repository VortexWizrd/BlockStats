ALTER TABLE "leaderboards" ADD COLUMN "blMapType" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blCountry" varchar(2);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ssCountry" varchar(2);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "subdivision" varchar(6);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blCountryRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blSubdivisionRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ssCountryRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ssSubdivisionRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "overallCountryRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "overallSubdivisionRank" integer;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "hmd" integer;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "controller" integer;