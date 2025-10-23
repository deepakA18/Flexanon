-- FlexAnon Subscription System (Hackathon MVP)
-- Simple, minimal, works!

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  wallet_address VARCHAR(64) PRIMARY KEY,
  plan VARCHAR(20) DEFAULT 'free', -- 'free' or 'pro'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  updates_used INT DEFAULT 0,
  updates_limit INT DEFAULT 10, -- 10 for free, 1000 for pro
  links_used INT DEFAULT 0,
  links_limit INT DEFAULT 1, -- 1 for free, 3 for pro
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- NULL for free, date for pro
  last_reset_at TIMESTAMP DEFAULT NOW() -- For monthly reset
);

-- Index for fast lookups
CREATE INDEX idx_wallet_plan ON subscriptions(wallet_address, plan);
