CREATE TABLE "snipefeeds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "snipefeeds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" varchar(32) NOT NULL,
	"channelType" varchar(32) NOT NULL,
	"displayType" varchar(32) NOT NULL,
	"userId" varchar(32),
	"channelId" varchar(32),
	"guildId" varchar(32),
	"managerRoleId" varchar(32),
	"playerIds" varchar(32)[] NOT NULL,
	"hasFilters" boolean NOT NULL,
	"ssRanked" boolean,
	"blRanked" boolean,
	"asRanked" boolean,
	"minRank" integer
);
