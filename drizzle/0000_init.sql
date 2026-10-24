CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(16) NOT NULL,
	"day" date NOT NULL,
	"skill_score" integer NOT NULL,
	"word_score" integer NOT NULL,
	"total" integer NOT NULL,
	"words" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "scores_day_total_idx" ON "scores" USING btree ("day","total");--> statement-breakpoint
CREATE INDEX "scores_total_idx" ON "scores" USING btree ("total");