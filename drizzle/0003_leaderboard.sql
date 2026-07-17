CREATE TABLE "leaderboards" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leaderboards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mapId" integer NOT NULL,
	"difficulty" varchar(64) NOT NULL,
	"characteristic" varchar(128) NOT NULL,
	"blLeaderboardId" varchar(32),
	"blRankedStatus" varchar(32),
	"blStarRating" double precision,
	"blTechRating" double precision,
	"blAccRating" double precision,
	"blPassRating" double precision,
	"ssLeaderboardId" integer,
	"ssRankedStatus" varchar(32),
	"ssStarRating" double precision,
	"asLeaderboardId" uuid,
	"asRankedStatus" varchar(32),
	"asCategoryId" uuid,
	"asCategoryCode" varchar(32),
	"asComplexity" double precision,
	"savedTime" timestamp NOT NULL,
	"updatedTime" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "maps_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"beatSaverId" varchar(32),
	"hash" varchar(64) NOT NULL,
	"songName" text NOT NULL,
	"songSubName" text NOT NULL,
	"songAuthor" text NOT NULL,
	"mapAuthor" text NOT NULL,
	"songCover" text NOT NULL,
	"leaderboardIds" integer[] NOT NULL,
	"savedTime" timestamp NOT NULL,
	"updatedTime" timestamp NOT NULL
);
