-- Create ENUM type for campaign status (idempotent)
DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('active', 'inactive', 'archived', 'draft');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create token_campaigns table to store full company/campaign information
CREATE TABLE IF NOT EXISTS token_campaigns (
  id SERIAL PRIMARY KEY,

  -- Blockchain identifiers
  launchpad_pubkey TEXT NOT NULL UNIQUE,
  mint_pubkey TEXT,
  token_vault_pubkey TEXT,
  authority_pubkey TEXT,
  token_uri TEXT,

  -- Basic Info
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  tagline TEXT,
  logo_url TEXT,
  cover_image_url TEXT,

  -- The Pitch
  elevator_pitch TEXT,
  problem TEXT,
  solution TEXT,
  why_now TEXT,

  -- Team (stored as JSON array)
  team_members JSONB DEFAULT '[]'::jsonb,

  -- Traction & Roadmap (stored as JSON arrays)
  traction_metrics JSONB DEFAULT '[]'::jsonb,
  roadmap_items JSONB DEFAULT '[]'::jsonb,

  -- Tokenomics
  fundraising_goal NUMERIC CHECK (fundraising_goal >= 0),
  equity_offered NUMERIC CHECK (equity_offered >= 0 AND equity_offered <= 100),
  founder_allocation NUMERIC CHECK (founder_allocation >= 0 AND founder_allocation <= 100),
  token_distribution JSONB DEFAULT '[]'::jsonb,
  use_of_funds JSONB DEFAULT '[]'::jsonb,

  -- Social & Media
  website_url TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  telegram_url TEXT,
  slider_images JSONB DEFAULT '[]'::jsonb,
  tweet_ids JSONB DEFAULT '[]'::jsonb,

  -- Deployment Info
  total_supply NUMERIC,
  tokens_for_sale NUMERIC,
  initial_price_lamports_per_token NUMERIC,

  -- Fundraising Parameters
  initial_valuation_sol NUMERIC CHECK (initial_valuation_sol >= 0),
  percentage_for_sale NUMERIC CHECK (percentage_for_sale >= 0 AND percentage_for_sale <= 100),
  target_raise_sol NUMERIC CHECK (target_raise_sol >= 0),

  -- Status
  status campaign_status DEFAULT 'active'::campaign_status,
  deployment_signature TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on launchpad_pubkey for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_campaigns_launchpad_pubkey
ON token_campaigns(launchpad_pubkey);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_token_campaigns_status
ON token_campaigns(status);

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_token_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER token_campaigns_updated_at
BEFORE UPDATE ON token_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_token_campaigns_updated_at();

-- Add comment to table
COMMENT ON TABLE token_campaigns IS 'Stores complete campaign/company information for token launches';
