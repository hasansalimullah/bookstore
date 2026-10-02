-- Storefront fields used by the product page / cards, plus newsletter subscribers.
ALTER TABLE books ADD COLUMN IF NOT EXISTS title_ar       TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS category       TEXT;   -- e.g. "Fiqh & Ahkam > Fiqh Hanbali > Usul Madhhab"
ALTER TABLE books ADD COLUMN IF NOT EXISTS edition        TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover          TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS print_quality  TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS format         TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS harakat        TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS extra_images   TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS books_created_idx ON books (created_at DESC);

CREATE TABLE IF NOT EXISTS subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
