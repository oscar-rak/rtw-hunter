-- RTW Łowca Okazji — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor

CREATE TABLE flight_deals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  source_url    TEXT UNIQUE NOT NULL,
  origin        TEXT NOT NULL,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  is_rtw_segment BOOLEAN DEFAULT false,
  status        TEXT DEFAULT 'New'
                CHECK (status IN ('New', 'Seen', 'Booked', 'Expired')),
  kanban_column TEXT DEFAULT 'misc'
                CHECK (kanban_column IN ('pl_azja', 'azja_usa_oceania', 'usa_pl', 'gotowce', 'misc'))
);

-- Indexes for Lovable frontend queries
CREATE INDEX ON flight_deals (kanban_column);
CREATE INDEX ON flight_deals (created_at DESC);
CREATE INDEX ON flight_deals (status);

-- Row Level Security
ALTER TABLE flight_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read"
  ON flight_deals FOR SELECT
  USING (true);

CREATE POLICY "service role full access"
  ON flight_deals
  USING (auth.role() = 'service_role');
