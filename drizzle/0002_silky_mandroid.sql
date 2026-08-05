CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;