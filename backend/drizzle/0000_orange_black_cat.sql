CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"user_name" text,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"google_id" text,
	"description" text,
	"avatar_url" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"last_seen_at" timestamp,
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp,
	CONSTRAINT "users_user_name_unique" UNIQUE("user_name"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"words" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "words_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"family_id" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"device_id" text,
	"user_agent" text,
	"ip_address" text,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" integer,
	"email" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_place" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"share_id" text NOT NULL,
	"owner_user_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"author_username" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"word_count" integer NOT NULL,
	"languages" text[],
	"source_language" text,
	"target_language" text,
	"downloads" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "market_place_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
CREATE TABLE "top_performers" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"data" json
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"path" text,
	"method" text,
	"status" integer,
	"user_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_user_id" integer NOT NULL,
	"target_type" text NOT NULL,
	"target_ref" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;