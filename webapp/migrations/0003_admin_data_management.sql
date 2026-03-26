-- =============================================================================
-- Admin Data Management – upload registry table
-- Tracks every CSV upload attempt per dataset type.
-- =============================================================================

CREATE TABLE IF NOT EXISTS upload_registry (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_key     TEXT NOT NULL,            -- e.g. 'demand', 'bom', 'inventory'
  file_name       TEXT NOT NULL,
  file_size_bytes INTEGER DEFAULT 0,
  row_count       INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending',   -- 'uploaded' | 'failed' | 'pending'
  error_message   TEXT,
  uploaded_by     TEXT NOT NULL,
  use_default     INTEGER DEFAULT 1,        -- 1 = fallback to default if failed
  uploaded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  validated_at    DATETIME
);

CREATE INDEX IF NOT EXISTS idx_upload_registry_key ON upload_registry(dataset_key, uploaded_at DESC);
