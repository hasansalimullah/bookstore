-- Shop layer: prices, orders, order items. Orders contain customer PII → admin only.
ALTER TABLE books ADD COLUMN IF NOT EXISTS price_cents INT CHECK (price_cents IS NULL OR price_cents >= 0);

CREATE TABLE IF NOT EXISTS orders (
  id                 BIGSERIAL PRIMARY KEY,
  public_id          TEXT NOT NULL UNIQUE,            -- unguessable token used in customer-facing URLs
  status             TEXT NOT NULL DEFAULT 'pending_payment'
                     CHECK (status IN ('pending_payment','paid','ordered_from_supplier','shipped','cancelled','refunded')),
  email              TEXT NOT NULL,
  name               TEXT NOT NULL,
  phone              TEXT,
  ship_line1         TEXT NOT NULL,
  ship_line2         TEXT,
  ship_city          TEXT NOT NULL,
  ship_region        TEXT,
  ship_postal_code   TEXT,
  ship_country       TEXT NOT NULL,
  currency           TEXT NOT NULL,
  subtotal_cents     INT NOT NULL,
  shipping_cents     INT NOT NULL,
  total_cents        INT NOT NULL,
  payment_mode       TEXT NOT NULL DEFAULT 'stripe',
  stripe_session_id  TEXT UNIQUE,
  stripe_payment_intent TEXT,
  admin_notes        TEXT,
  tracking_info      TEXT,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id               BIGSERIAL PRIMARY KEY,
  order_id         BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id          BIGINT REFERENCES books(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,          -- snapshot at purchase time
  unit_price_cents INT NOT NULL,
  quantity         INT NOT NULL CHECK (quantity BETWEEN 1 AND 10)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
