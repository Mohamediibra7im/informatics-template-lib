CREATE TABLE "template_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category_id" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"complexity" text DEFAULT '' NOT NULL,
	"notes" text,
	"hidden" boolean DEFAULT false NOT NULL,
	"contributor_name" text,
	"contributor_cf_handle" text,
	"codes" jsonb,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "template_history" ADD CONSTRAINT "template_history_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;