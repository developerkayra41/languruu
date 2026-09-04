ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xp_day" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xp_day_amount" integer DEFAULT 0 NOT NULL;