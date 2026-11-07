-- D1 は CHECK 内の複雑な GLOB を実行時に拒否する。
-- 文字色の16進チェックはアプリが行う。ここでは長さと先頭の # だけにする。
-- 0002 で作った表を、同じ列の並びで作り直す。

CREATE TABLE m_bank_purpose_migration_rows AS
SELECT
  id,
  user_id,
  name,
  text_color,
  source_id,
  created_at,
  updated_at,
  deleted_at,
  created_by,
  updated_by,
  deleted_by
FROM m_bank_purposes;

CREATE TABLE m_bank_purpose_migration_links AS
SELECT id AS transaction_id, purpose_id
FROM t_bank_transactions
WHERE purpose_id IS NOT NULL;

DROP INDEX idx_t_bank_transactions_purpose_id;

ALTER TABLE t_bank_transactions DROP COLUMN purpose_id;

DROP TABLE m_bank_purposes;

CREATE TABLE m_bank_purposes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (
    length(trim(name)) > 0 AND length(name) <= 30
  ),
  text_color TEXT NOT NULL DEFAULT '#000000' CHECK (
    length(text_color) = 7 AND substr(text_color, 1, 1) = '#'
  ),
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

INSERT INTO m_bank_purposes (
  id,
  user_id,
  name,
  text_color,
  source_id,
  created_at,
  updated_at,
  deleted_at,
  created_by,
  updated_by,
  deleted_by
)
SELECT
  id,
  user_id,
  name,
  text_color,
  source_id,
  created_at,
  updated_at,
  deleted_at,
  created_by,
  updated_by,
  deleted_by
FROM m_bank_purpose_migration_rows;

CREATE INDEX idx_m_bank_purposes_user_id ON m_bank_purposes(user_id);

CREATE UNIQUE INDEX idx_m_bank_purposes_user_name_active
  ON m_bank_purposes(user_id, name)
  WHERE deleted_at IS NULL;

ALTER TABLE t_bank_transactions ADD COLUMN purpose_id INTEGER REFERENCES m_bank_purposes(id);

UPDATE t_bank_transactions
SET purpose_id = (
  SELECT purpose_id
  FROM m_bank_purpose_migration_links
  WHERE m_bank_purpose_migration_links.transaction_id = t_bank_transactions.id
)
WHERE id IN (SELECT transaction_id FROM m_bank_purpose_migration_links);

CREATE INDEX idx_t_bank_transactions_purpose_id ON t_bank_transactions(purpose_id);

DROP TABLE m_bank_purpose_migration_rows;
DROP TABLE m_bank_purpose_migration_links;
