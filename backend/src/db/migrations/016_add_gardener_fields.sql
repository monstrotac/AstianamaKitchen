ALTER TABLE character_sheets
  ADD COLUMN IF NOT EXISTS gardener_name TEXT,
  ADD COLUMN IF NOT EXISTS name_origin   TEXT;
