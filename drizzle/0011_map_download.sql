CREATE TABLE "mapdownloads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mapdownloads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mapId" integer NOT NULL,
	"url" text NOT NULL,
	"uploaderId" varchar(32) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mapdownloads" ADD CONSTRAINT "mapdownloads_mapId_maps_id_fk" FOREIGN KEY ("mapId") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mapdownloads" ADD CONSTRAINT "mapdownloads_uploaderId_players_id_fk" FOREIGN KEY ("uploaderId") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;