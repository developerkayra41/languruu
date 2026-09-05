CREATE TABLE "global_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"body" text NOT NULL,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "global_messages" ADD CONSTRAINT "global_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "global_messages_feed_idx" ON "global_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "global_messages_author_idx" ON "global_messages" USING btree ("user_id");