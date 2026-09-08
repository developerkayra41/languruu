ALTER TABLE "users" ADD COLUMN "reengaged_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reengagement_opt_out" boolean DEFAULT false NOT NULL;