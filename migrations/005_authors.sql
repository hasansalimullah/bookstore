-- Authors become real records (admin groups books by author). books.author (text) stays as the display name.
CREATE TABLE IF NOT EXISTS authors (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS authors_name_lower_idx ON authors (lower(name));

ALTER TABLE books ADD COLUMN IF NOT EXISTS author_id BIGINT REFERENCES authors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS books_author_idx ON books (author_id);

-- Backfill from existing text authors.
INSERT INTO authors (name)
  SELECT DISTINCT ON (lower(trim(author))) trim(author) FROM books WHERE author IS NOT NULL AND trim(author) <> ''
  ON CONFLICT DO NOTHING;
UPDATE books SET author_id = a.id FROM authors a WHERE books.author_id IS NULL AND books.author IS NOT NULL AND lower(trim(books.author)) = lower(a.name);
