CREATE TABLE IF NOT EXISTS contract_rolls (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  rolled_by    UUID NOT NULL REFERENCES users(id),
  situation    TEXT NOT NULL,
  skill_name   TEXT NOT NULL,
  skill_bonus  INT NOT NULL,
  dc           INT NOT NULL,
  natural_roll INT NOT NULL CHECK (natural_roll BETWEEN 1 AND 20),
  modifier     INT NOT NULL,
  total        INT NOT NULL,
  outcome      TEXT NOT NULL CHECK (outcome IN ('success','failure','nat20','nat1')),
  rolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rolls_contract_id ON contract_rolls(contract_id);
