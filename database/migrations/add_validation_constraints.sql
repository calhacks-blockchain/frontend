-- Migration to add validation constraints to existing token_campaigns table

-- 1. Create ENUM type for campaign status (idempotent)
DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('active', 'inactive', 'archived', 'draft');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add CHECK constraints to Tokenomics fields
-- Using IF NOT EXISTS pattern for idempotency
DO $$ BEGIN
  ALTER TABLE token_campaigns 
    ADD CONSTRAINT check_fundraising_goal CHECK (fundraising_goal >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE token_campaigns 
    ADD CONSTRAINT check_equity_offered CHECK (equity_offered >= 0 AND equity_offered <= 100);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE token_campaigns 
    ADD CONSTRAINT check_founder_allocation CHECK (founder_allocation >= 0 AND founder_allocation <= 100);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Add CHECK constraints to Fundraising Parameters
DO $$ BEGIN
  ALTER TABLE token_campaigns 
    ADD CONSTRAINT check_initial_valuation_sol CHECK (initial_valuation_sol >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE token_campaigns 
    ADD CONSTRAINT check_percentage_for_sale CHECK (percentage_for_sale >= 0 AND percentage_for_sale <= 100);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE token_campaigns 
    ADD CONSTRAINT check_target_raise_sol CHECK (target_raise_sol >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Convert status column to ENUM type
-- First, drop the default
ALTER TABLE token_campaigns 
  ALTER COLUMN status DROP DEFAULT;

-- Convert the column type (this will convert existing 'active' TEXT values to 'active' ENUM values)
ALTER TABLE token_campaigns 
  ALTER COLUMN status TYPE campaign_status 
  USING status::campaign_status;

-- Re-add the default with proper ENUM type
ALTER TABLE token_campaigns 
  ALTER COLUMN status SET DEFAULT 'active'::campaign_status;

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '- Created campaign_status ENUM type';
  RAISE NOTICE '- Added CHECK constraints for non-negative values';
  RAISE NOTICE '- Added CHECK constraints for percentage ranges (0-100)';
  RAISE NOTICE '- Converted status column to campaign_status ENUM';
END $$;

