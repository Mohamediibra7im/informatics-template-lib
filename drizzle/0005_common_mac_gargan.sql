CREATE TABLE "contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"contributor_name" text NOT NULL,
	"contributor_email" text NOT NULL,
	"contributor_cf_handle" text,
	"title" text,
	"slug" text,
	"description" text,
	"category_id" integer,
	"tags" text[] DEFAULT '{}',
	"complexity" text,
	"notes" text,
	"codes" jsonb,
	"template_id" integer,
	"edit_reason" text,
	"edit_codes" jsonb,
	"edit_notes" text,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "contributor_name" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "contributor_cf_handle" text;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;