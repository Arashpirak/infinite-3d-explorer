-- Create user_domains table if it does not exist
CREATE TABLE IF NOT EXISTS "user_domains" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "project_id" TEXT NULL,
  "domain" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Unique constraint per user and domain
DO $$ BEGIN
  ALTER TABLE "user_domains" ADD CONSTRAINT "user_domains_user_domain_unique" UNIQUE ("user_id", "domain");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "user_domains" ADD CONSTRAINT "user_domains_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "user_domains" ADD CONSTRAINT "user_domains_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "chatbot_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create domain_api_usage table if it does not exist
CREATE TABLE IF NOT EXISTS "domain_api_usage" (
  "id" TEXT PRIMARY KEY,
  "domain_id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "tokens_in" INTEGER NOT NULL DEFAULT 0,
  "tokens_out" INTEGER NOT NULL DEFAULT 0,
  "cost" DECIMAL(10,6) NOT NULL DEFAULT 0,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Foreign key for usage
DO $$ BEGIN
  ALTER TABLE "domain_api_usage" ADD CONSTRAINT "domain_api_usage_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "user_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


