-- Public table: safe to expose (never contains source URLs or internals).
CREATE TABLE IF NOT EXISTS books (
  id                BIGSERIAL PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  author            TEXT,
  description       TEXT,
  image_url         TEXT,
  availability      TEXT NOT NULL DEFAULT 'unknown'
                    CHECK (availability IN ('available','out_of_stock','unknown')),
  last_checked      TIMESTAMPTZ,          -- last attempt (success or failure)
  last_success_at   TIMESTAMPTZ,          -- last attempt that produced a definite answer
  published         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRIVATE table: the only place the source URL lives. Never joined in public queries.
CREATE TABLE IF NOT EXISTS book_sources (
  book_id              BIGINT PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
  source_url_private   TEXT NOT NULL,
  source_product_id    TEXT,                 -- last path segment / id, informational
  monitoring_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  last_check_status    TEXT CHECK (last_check_status IN ('ok','error')),
  last_error           TEXT,
  consecutive_failures INT NOT NULL DEFAULT 0,
  next_check_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS book_sources_due_idx
  ON book_sources (next_check_at) WHERE monitoring_enabled;

-- PRIVATE table: history of every check (admin only).
CREATE TABLE IF NOT EXISTS check_logs (
  id              BIGSERIAL PRIMARY KEY,
  book_id         BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger         TEXT NOT NULL CHECK (trigger IN ('scheduled','manual','test')),
  outcome         TEXT NOT NULL CHECK (outcome IN ('ok','error')),
  parsed_status   TEXT NOT NULL CHECK (parsed_status IN ('AVAILABLE','OUT_OF_STOCK','UNKNOWN')),
  http_status     INT,
  selector_found  BOOLEAN,
  detected_text   TEXT,
  reason          TEXT,                       -- parser reason or error code
  error_message   TEXT,
  duration_ms     INT,
  debug           JSONB                       -- parser details; may reference the source, admin only
);
CREATE INDEX IF NOT EXISTS check_logs_book_idx ON check_logs (book_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS check_logs_time_idx ON check_logs (checked_at);
