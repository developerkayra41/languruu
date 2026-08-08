ALTER TABLE "users" ADD COLUMN "study_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_study_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "completed_rounds" integer DEFAULT 0 NOT NULL;