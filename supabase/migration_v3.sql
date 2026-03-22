-- RTW Hunter v3 migration
-- Run in: Supabase Dashboard → SQL Editor

-- Zamień kanban constraint: segment → gotowce_rtw
ALTER TABLE flight_deals
  DROP CONSTRAINT IF EXISTS flight_deals_kanban_column_check;

ALTER TABLE flight_deals
  ADD CONSTRAINT flight_deals_kanban_column_check
  CHECK (kanban_column IN ('gotowce_rtw', 'pl_azja', 'azja_usa_oceania', 'usa_pl', 'misc'));

-- Ustaw stare 'gotowce' i 'segment' na nową wartość
UPDATE flight_deals SET kanban_column = 'gotowce_rtw' WHERE kanban_column = 'gotowce';
UPDATE flight_deals SET kanban_column = 'misc' WHERE kanban_column = 'segment';
