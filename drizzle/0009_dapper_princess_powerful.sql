ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_expires" timestamp;