CREATE TABLE IF NOT EXISTS discount_codes (
  id                  BIGSERIAL PRIMARY KEY,
  code                TEXT NOT NULL UNIQUE,
  kind                TEXT NOT NULL CHECK (kind IN ('percent','fixed')),
  value               INT  NOT NULL CHECK (value > 0),
  min_subtotal_cents  INT  NOT NULL DEFAULT 0,
  max_uses            INT,
  uses                INT  NOT NULL DEFAULT 0,
  starts_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code  TEXT;