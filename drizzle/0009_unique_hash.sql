ALTER TABLE "ppFeeds" ALTER COLUMN "requestType" SET DEFAULT 'closed';--> statement-breakpoint
ALTER TABLE "rankfeeds" ALTER COLUMN "requestType" SET DEFAULT 'closed';--> statement-breakpoint
ALTER TABLE "scorefeeds" ALTER COLUMN "requestType" SET DEFAULT 'closed';--> statement-breakpoint
ALTER TABLE "snipefeeds" ALTER COLUMN "requestType" SET DEFAULT 'closed';--> statement-breakpoint
DELETE FROM "maps" a 
USING "maps" b 
WHERE a.hash = b.hash 
  AND a.id > b.id;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_hash_unique" UNIQUE("hash");