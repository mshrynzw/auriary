-- 銀行摘要とは別に、利用者が「何に使ったか」を残すメモ
ALTER TABLE t_bank_transactions
  ADD COLUMN memo TEXT;

ALTER TABLE t_bank_transactions
  ADD CONSTRAINT t_bank_transactions_memo_length_check
  CHECK (memo IS NULL OR char_length(memo) <= 500);

COMMENT ON COLUMN t_bank_transactions.memo IS '利用者が記入する支出内容のメモ。空のときは NULL。';
