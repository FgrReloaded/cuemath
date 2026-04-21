ALTER TABLE "decks" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "decks" ADD COLUMN "share_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "decks_share_token_idx" ON "decks" USING btree ("share_token");