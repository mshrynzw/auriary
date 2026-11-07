-- 収支明細の「用途」。選択肢はユーザーごと。文字色は #RRGGBB。
-- 明細の purpose_id が NULL のときは未設定。
-- 削除は deleted_at。使っていた明細の purpose_id はアプリが NULL に戻す。

CREATE TABLE m_bank_purposes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (
    length(trim(name)) > 0 AND length(name) <= 30
  ),
  text_color TEXT NOT NULL DEFAULT '#000000' CHECK (
    text_color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
  ),
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

CREATE INDEX idx_m_bank_purposes_user_id ON m_bank_purposes(user_id);

CREATE UNIQUE INDEX idx_m_bank_purposes_user_name_active
  ON m_bank_purposes(user_id, name)
  WHERE deleted_at IS NULL;

ALTER TABLE t_bank_transactions ADD COLUMN purpose_id INTEGER REFERENCES m_bank_purposes(id);

CREATE INDEX idx_t_bank_transactions_purpose_id ON t_bank_transactions(purpose_id);
