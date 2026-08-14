CREATE TABLE "user_collection_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"invited_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_collection_members_collection_id_user_id_unique" UNIQUE("collection_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "user_collection_members" ADD CONSTRAINT "user_collection_members_collection_id_user_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."user_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collection_members" ADD CONSTRAINT "user_collection_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collection_members" ADD CONSTRAINT "user_collection_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;