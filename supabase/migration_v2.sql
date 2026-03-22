-- RTW Hunter v2 migration
-- Run in: Supabase Dashboard → SQL Editor

-- 1. Dodaj kolumnę departure_tag
ALTER TABLE flight_deals
  ADD COLUMN IF NOT EXISTS departure_tag TEXT;

-- 2. Rozszerz kanban_column o 'segment'
--    (musimy przebudować constraint)
ALTER TABLE flight_deals
  DROP CONSTRAINT IF EXISTS flight_deals_kanban_column_check;

ALTER TABLE flight_deals
  ADD CONSTRAINT flight_deals_kanban_column_check
  CHECK (kanban_column IN ('pl_azja', 'azja_usa_oceania', 'usa_pl', 'gotowce', 'segment', 'misc'));

-- 3. Indeks na departure_tag
CREATE INDEX IF NOT EXISTS flight_deals_departure_tag_idx ON flight_deals (departure_tag);
