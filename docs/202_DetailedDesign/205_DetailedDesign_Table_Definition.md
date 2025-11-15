## m_users（ユーザーマスタ）

ユーザー（あなた自身や将来的な複数ユーザー）の基本情報を管理するマスタテーブル。
Supabase の `auth.users` と紐づくアプリ側ユーザーマスタ。

| No | 物理名              | 論理名         | 型           | NULL     | キー | 説明                                      |
| -- | ---------------- | ----------- | ----------- | -------- | -- | --------------------------------------- |
| 1  | id               | ユーザーID      | BIGINT      | NOT NULL | PK | アプリ内で一意となるユーザーID。                       |
| 2  | auth_user_id     | 認証ユーザーID    | UUID        | NOT NULL |    | Supabase `auth.users.id` を想定。認証基盤との紐付け。 |
| 3  | display_name     | 表示名         | TEXT        | NOT NULL |    | 画面に表示するユーザー名。ニックネームなど。                  |
| 4  | family_name      | 姓           | TEXT        | NULL     |    | 本名の姓。必要に応じて利用。                          |
| 5  | first_name       | 名           | TEXT        | NULL     |    | 本名の名。                                   |
| 6  | family_name_kana | セイ（フリガナ）    | TEXT        | NULL     |    | 姓のカナ表記。                                 |
| 7  | first_name_kana  | メイ（フリガナ）    | TEXT        | NULL     |    | 名のカナ表記。                                 |
| 8  | email            | メールアドレス     | TEXT        | NULL     |    | 連絡用メールアドレス。未設定も許容。                      |
| 9  | is_active        | 有効フラグ       | BOOLEAN     | NOT NULL |    | アカウントの有効・無効（退会など）。                      |
| 10 | source_id        | 元レコードID     | BIGINT      | NULL     |    | バージョン管理用。過去レコードを指す場合に使用。                |
| 11 | created_at       | 作成日時        | TIMESTAMPTZ | NOT NULL |    | レコード作成日時。                               |
| 12 | updated_at       | 更新日時        | TIMESTAMPTZ | NOT NULL |    | レコード最終更新日時。                             |
| 13 | deleted_at       | 削除日時        | TIMESTAMPTZ | NULL     |    | ソフトデリート用。削除時刻。                          |
| 14 | created_by       | 作成者ユーザーUUID | UUID        | NOT NULL |    | 作成したユーザーの `auth_user_id` など。            |
| 15 | updated_by       | 更新者ユーザーUUID | UUID        | NOT NULL |    | 最終更新を行ったユーザー。                           |
| 16 | deleted_by       | 削除者ユーザーUUID | UUID        | NULL     |    | 削除操作を行ったユーザー。                           |

---

## m_user_daily_defaults（日記のデフォルト設定）

ユーザーごとに、「日記を書かなかった日」に使う**デフォルト値**を保存するマスタ。
強迫観念を減らすための「基準値」を持つテーブル。

| No | 物理名                        | 論理名          | 型           | NULL     | キー | 説明                                  |
| -- | -------------------------- | ------------ | ----------- | -------- | -- | ----------------------------------- |
| 1  | id                         | 日々デフォルトID    | BIGINT      | NOT NULL | PK | レコードID。                             |
| 2  | user_id                    | ユーザーID       | BIGINT      | NOT NULL | FK | `m_users.id`。デフォルトの持ち主。             |
| 3  | sleep_quality_default      | 睡眠の質デフォルト    | SMALLINT    | NOT NULL |    | 1〜5。1=とても悪い〜5=とても良い。                |
| 4  | wake_level_default          | 目覚め時の気分デフォルト | SMALLINT    | NOT NULL |    | 1〜5。1=最悪〜5=とても良い。                   |
| 5  | daytime_level_default       | 日中の気分デフォルト   | SMALLINT    | NOT NULL |    | 1〜5。                                |
| 6  | pre_sleep_level_default     | 就寝前の気分デフォルト  | SMALLINT    | NOT NULL |    | 1〜5。                                |
| 7  | med_adherence_level_default      | 服薬遵守度デフォルト   | SMALLINT    | NOT NULL |    | 1〜5。1=全く飲めず〜5=全部飲めた。                |
| 8  | appetite_level_default     | 食欲レベルデフォルト   | SMALLINT    | NOT NULL |    | 1〜5。1=ない,2=あまりない,3=ふつう,4=ややある,5=ある。 |
| 9  | sleep_desire_level_default | 睡眠欲レベルデフォルト  | SMALLINT    | NOT NULL |    | 1〜5。同上スケール。                         |
| 10 | source_id                  | 元レコードID      | BIGINT      | NULL     |    | バージョン管理用。                           |
| 11 | created_at                 | 作成日時         | TIMESTAMPTZ | NOT NULL |    | レコード作成日時。                           |
| 12 | updated_at                 | 更新日時         | TIMESTAMPTZ | NOT NULL |    | レコード最終更新日時。                         |
| 13 | deleted_at                 | 削除日時         | TIMESTAMPTZ | NULL     |    | ソフトデリート。                            |
| 14 | created_by                 | 作成者ユーザーUUID  | UUID        | NOT NULL |    |                                     |
| 15 | updated_by                 | 更新者ユーザーUUID  | UUID        | NOT NULL |    |                                     |
| 16 | deleted_by                 | 削除者ユーザーUUID  | UUID        | NULL     |    |                                     |

---

## m_medications（薬マスタ）

処方薬や市販薬など、**薬そのものの情報**を管理するマスタ。

| No | 物理名          | 論理名         | 型           | NULL     | キー | 説明            |
| -- | ------------ | ----------- | ----------- | -------- | -- | ------------- |
| 1  | id           | 薬ID         | BIGINT      | NOT NULL | PK | 薬マスタの一意なID。   |
| 2  | name         | 薬名          | TEXT        | NOT NULL |    | 商品名など。        |
| 3  | generic_name | 一般名（成分名）    | TEXT        | NULL     |    | 有効成分名など。      |
| 4  | memo         | メモ          | TEXT        | NULL     |    | 備考、注意点など自由記述。 |
| 5  | source_id    | 元レコードID     | BIGINT      | NULL     |    | バージョン管理用。     |
| 6  | created_at   | 作成日時        | TIMESTAMPTZ | NOT NULL |    |               |
| 7  | updated_at   | 更新日時        | TIMESTAMPTZ | NOT NULL |    |               |
| 8  | deleted_at   | 削除日時        | TIMESTAMPTZ | NULL     |    |               |
| 9  | created_by   | 作成者ユーザーUUID | UUID        | NOT NULL |    |               |
| 10 | updated_by   | 更新者ユーザーUUID | UUID        | NOT NULL |    |               |
| 11 | deleted_by   | 削除者ユーザーUUID | UUID        | NULL     |    |               |

---

## r_user_medications（ユーザー別処方）

あるユーザーに対して、**どの薬を・いつからいつまで・どのくらいの量で処方されているか**を管理するリレーション。

| No | 物理名           | 論理名         | 型           | NULL     | キー | 説明                  |
| -- | ------------- | ----------- | ----------- | -------- | -- | ------------------- |
| 1  | id            | ユーザー処方ID    | BIGINT      | NOT NULL | PK | レコードID。             |
| 2  | user_id       | ユーザーID      | BIGINT      | NOT NULL | FK | `m_users.id`。       |
| 3  | medication_id | 薬ID         | BIGINT      | NOT NULL | FK | `m_medications.id`。 |
| 4  | dosage_text   | 用法・用量テキスト   | TEXT        | NULL     |    | 「朝1錠・寝る前1錠」など自由入力。  |
| 5  | dose_amount   | 量（数値）       | NUMERIC     | NULL     |    | 1, 0.5 など。          |
| 6  | dose_unit     | 量の単位        | TEXT        | NULL     |    | ‘錠’, ‘mg’ など。       |
| 7  | start_date    | 開始日         | DATE        | NOT NULL |    | 処方開始日。              |
| 8  | end_date      | 終了日         | DATE        | NULL     |    | 終了していなければ NULL。     |
| 9  | is_current    | 現在有効フラグ     | BOOLEAN     | NOT NULL |    | 現在も継続中の処方かどうか。      |
| 10 | source_id     | 元レコードID     | BIGINT      | NULL     |    | バージョン管理用。           |
| 11 | created_at    | 作成日時        | TIMESTAMPTZ | NOT NULL |    |                     |
| 12 | updated_at    | 更新日時        | TIMESTAMPTZ | NOT NULL |    |                     |
| 13 | deleted_at    | 削除日時        | TIMESTAMPTZ | NULL     |    |                     |
| 14 | created_by    | 作成者ユーザーUUID | UUID        | NOT NULL |    |                     |
| 15 | updated_by    | 更新者ユーザーUUID | UUID        | NOT NULL |    |                     |
| 16 | deleted_by    | 削除者ユーザーUUID | UUID        | NULL     |    |                     |

---

## r_user_ext_accounts（外部アカウント連携）

ユーザーごとの **Google / LINE / Cloudflare など外部サービスとの紐付け情報**を管理。

| No | 物理名                     | 論理名              | 型           | NULL     | キー | 説明                                 |
| -- | ----------------------- | ---------------- | ----------- | -------- | -- | ---------------------------------- |
| 1  | id                      | 外部連携ID           | BIGINT      | NOT NULL | PK | レコードID。                            |
| 2  | user_id                 | ユーザーID           | BIGINT      | NOT NULL | FK | `m_users.id`。                      |
| 3  | provider                | プロバイダ種別          | TEXT        | NOT NULL |    | 'google', 'line', 'cloudflare' など。 |
| 4  | ext_user_id        | 外部ユーザーID         | TEXT        | NOT NULL |    | プロバイダ側のユーザー識別子。                    |
| 5  | access_token_encrypted  | アクセストークン（暗号化済み）  | TEXT        | NULL     |    | 必要に応じて保存。                          |
| 6  | refresh_token_encrypted | リフレッシュトークン（暗号化済） | TEXT        | NULL     |    | 同上。                                |
| 7  | token_expires_at        | トークン有効期限         | TIMESTAMPTZ | NULL     |    | アクセストークンの有効期限。                     |
| 8  | source_id               | 元レコードID          | BIGINT      | NULL     |    | バージョン管理用。                          |
| 9  | created_at              | 作成日時             | TIMESTAMPTZ | NOT NULL |    |                                    |
| 10 | updated_at              | 更新日時             | TIMESTAMPTZ | NOT NULL |    |                                    |
| 11 | deleted_at              | 削除日時             | TIMESTAMPTZ | NULL     |    |                                    |
| 12 | created_by              | 作成者ユーザーUUID      | UUID        | NOT NULL |    |                                    |
| 13 | updated_by              | 更新者ユーザーUUID      | UUID        | NOT NULL |    |                                    |
| 14 | deleted_by              | 削除者ユーザーUUID      | UUID        | NULL     |    |                                    |

---

## t_diaries（日記・日次記録）

1日単位での **睡眠・入浴・気分・服薬・日記本文** を記録するメイントランザクションテーブル。
日付＋ユーザー単位で1レコード想定。

| No | 物理名                | 論理名            | 型           | NULL     | キー | 説明                    |
| -- | ------------------ | -------------- | ----------- | -------- | -- | --------------------- |
| 1  | id                 | 日記ID           | BIGINT      | NOT NULL | PK | 日記レコードID。             |
| 2  | user_id            | ユーザーID         | BIGINT      | NOT NULL | FK | `m_users.id`。         |
| 3  | journal_date       | 記録対象日          | DATE        | NOT NULL |    | その日の日記の日付。ユニークキー候補。   |
| 4  | sleep_start_at     | 就寝時刻           | TIMESTAMPTZ | NULL     |    | 寝始めた時刻。               |
| 5  | sleep_end_at       | 起床時刻           | TIMESTAMPTZ | NULL     |    | 起きた時刻。                |
| 6  | bath_start_at      | 入浴開始時刻         | TIMESTAMPTZ | NULL     |    | 風呂に入り始めた時刻。           |
| 7  | bath_end_at        | 入浴終了時刻         | TIMESTAMPTZ | NULL     |    | 風呂から上がった時刻。           |
| 8  | sleep_quality      | 睡眠の質           | SMALLINT    | NULL     |    | 1〜5。1=ほぼ眠れない,5=よく眠れた。 |
| 9  | wake_level          | 起床時の気分         | SMALLINT    | NULL     |    | 1〜5。1=最悪,5=とても良い。     |
| 10 | daytime_level       | 日中の気分          | SMALLINT    | NULL     |    | 1〜5。                  |
| 11 | pre_sleep_level     | 就寝前の気分         | SMALLINT    | NULL     |    | 1〜5。                  |
| 12 | med_adherence_level      | 服薬遵守度          | SMALLINT    | NULL     |    | 1〜5。1=全く飲めず,5=全部飲めた。  |
| 13 | appetite_level     | 食欲レベル          | SMALLINT    | NULL     |    | 1〜5。1=ない〜5=ある。        |
| 14 | sleep_desire_level | 睡眠欲レベル         | SMALLINT    | NULL     |    | 1〜5。                  |
| 15 | note      | 日記本文（Markdown） | TEXT        | NULL     |    | 自由記述。Markdownで記録。     |
| 16 | has_od             | OD発生フラグ        | BOOLEAN     | NULL     |    | その日に OD があったか。        |
| 17 | source_id          | 元レコードID        | BIGINT      | NULL     |    | バージョン管理用。             |
| 18 | created_at         | 作成日時           | TIMESTAMPTZ | NOT NULL |    |                       |
| 19 | updated_at         | 更新日時           | TIMESTAMPTZ | NOT NULL |    |                       |
| 20 | deleted_at         | 削除日時           | TIMESTAMPTZ | NULL     |    |                       |
| 21 | created_by         | 作成者ユーザーUUID    | UUID        | NOT NULL |    |                       |
| 22 | updated_by         | 更新者ユーザーUUID    | UUID        | NOT NULL |    |                       |
| 23 | deleted_by         | 削除者ユーザーUUID    | UUID        | NULL     |    |                       |

---

## t_diary_attachments（日記添付）

`t_diaries` に紐づく **画像・動画などの添付ファイル** の情報を管理。

| No | 物理名            | 論理名         | 型           | NULL     | キー | 説明                           |
| -- | -------------- | ----------- | ----------- | -------- | -- | ---------------------------- |
| 1  | id             | 日記添付ID      | BIGINT      | NOT NULL | PK | 添付ファイルレコードID。                |
| 2  | diaries_id     | 日記ID        | BIGINT      | NOT NULL | FK | 紐付く `t_diaries.id`。          |
| 3  | file_path      | ファイルパス      | TEXT        | NOT NULL |    | Supabase Storage などのパス。      |
| 4  | file_type      | ファイル種別      | TEXT        | NOT NULL |    | 'image/png', 'video/mp4' など。 |
| 5  | file_size      | ファイルサイズ     | BIGINT      | NULL     |    | バイト数など。                      |
| 6  | thumbnail_path | サムネイルファイルパス | TEXT        | NULL     |    | 画像のサムネイルがある場合。               |
| 7  | source_id      | 元レコードID     | BIGINT      | NULL     |    | バージョン管理用。                    |
| 8  | created_at     | 作成日時        | TIMESTAMPTZ | NOT NULL |    |                              |
| 9  | updated_at     | 更新日時        | TIMESTAMPTZ | NOT NULL |    |                              |
| 10 | deleted_at     | 削除日時        | TIMESTAMPTZ | NULL     |    |                              |
| 11 | created_by     | 作成者ユーザーUUID | UUID        | NOT NULL |    |                              |
| 12 | updated_by     | 更新者ユーザーUUID | UUID        | NOT NULL |    |                              |
| 13 | deleted_by     | 削除者ユーザーUUID | UUID        | NULL     |    |                              |

---

## t_overdoses（OD記録）

いつ・何を・どれだけ OD したか、その状況を記録するテーブル。

| No | 物理名             | 論理名         | 型           | NULL     | キー | 説明                               |
| -- | --------------- | ----------- | ----------- | -------- | -- | -------------------------------- |
| 1  | id              | OD記録ID      | BIGINT      | NOT NULL | PK | ODレコードID。                        |
| 2  | user_id         | ユーザーID      | BIGINT      | NOT NULL | FK | `m_users.id`。                    |
| 3  | occurred_at     | OD発生日時      | TIMESTAMPTZ | NOT NULL |    | ODした日時。                          |
| 4  | medication_id   | 薬ID         | BIGINT      | NULL     | FK | `m_medications.id`。マスタ登録されている場合。 |
| 5  | medication_name | 薬名（自由入力）    | TEXT        | NULL     |    | 市販薬など、マスタ外の名称。                   |
| 6  | amount          | 摂取量         | NUMERIC     | NULL     |    | 錠数や mg など。                       |
| 7  | amount_unit     | 摂取量単位       | TEXT        | NULL     |    | '錠', 'mg' など。                    |
| 8  | note    | 状況メモ        | TEXT        | NULL     |    | きっかけや状況など。                       |
| 9  | source_id       | 元レコードID     | BIGINT      | NULL     |    | バージョン管理用。                        |
| 10 | created_at      | 作成日時        | TIMESTAMPTZ | NOT NULL |    |                                  |
| 11 | updated_at      | 更新日時        | TIMESTAMPTZ | NOT NULL |    |                                  |
| 12 | deleted_at      | 削除日時        | TIMESTAMPTZ | NULL     |    |                                  |
| 13 | created_by      | 作成者ユーザーUUID | UUID        | NOT NULL |    |                                  |
| 14 | updated_by      | 更新者ユーザーUUID | UUID        | NOT NULL |    |                                  |
| 15 | deleted_by      | 削除者ユーザーUUID | UUID        | NULL     |    |                                  |

---

## t_medication_intakes（服薬実績）

その日どれくらい**実際に薬を飲めたか**を、処方単位で記録するテーブル。

| No | 物理名                | 論理名         | 型           | NULL     | キー | 説明                       |
| -- | ------------------ | ----------- | ----------- | -------- | -- | ------------------------ |
| 1  | id                 | 服薬実績ID      | BIGINT      | NOT NULL | PK | レコードID。                  |
| 2  | user_id            | ユーザーID      | BIGINT      | NOT NULL | FK | `m_users.id`。            |
| 3  | user_medication_id | ユーザー処方ID    | BIGINT      | NOT NULL | FK | `r_user_medications.id`。 |
| 4  | intake_date        | 服薬対象日       | DATE        | NOT NULL |    | どの日の服薬か。                 |
| 5  | adherence_score    | 服薬遵守度スコア    | SMALLINT    | NULL     |    | 1〜5。1=全く飲めず〜5=全部飲めた。     |
| 6  | note               | メモ          | TEXT        | NULL     |    | 「朝だけ飲めた」など補足。            |
| 7  | source_id          | 元レコードID     | BIGINT      | NULL     |    | バージョン管理用。                |
| 8  | created_at         | 作成日時        | TIMESTAMPTZ | NOT NULL |    |                          |
| 9  | updated_at         | 更新日時        | TIMESTAMPTZ | NOT NULL |    |                          |
| 10 | deleted_at         | 削除日時        | TIMESTAMPTZ | NULL     |    |                          |
| 11 | created_by         | 作成者ユーザーUUID | UUID        | NOT NULL |    |                          |
| 12 | updated_by         | 更新者ユーザーUUID | UUID        | NOT NULL |    |                          |
| 13 | deleted_by         | 削除者ユーザーUUID | UUID        | NULL     |    |                          |
