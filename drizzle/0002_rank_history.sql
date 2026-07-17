CREATE TABLE "playerrankhistories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "playerrankhistories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"playerId" varchar(32) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"rank" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "blRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ssRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "asRank" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "overallRank" integer;--> statement-breakpoint
CREATE INDEX "rankhistory_timestamp_idx" ON "playerrankhistories" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "rankhistory_rank_idx" ON "playerrankhistories" USING btree ("rank");