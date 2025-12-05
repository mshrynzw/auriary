erDiagram
	direction TB
	m_users {
		BIGINT id PK "NOT NULL"  
		UUID auth_user_id  "NOT NULL"  
		TEXT display_name  "NOT NULL"  
		TEXT family_name  "NULL"  
		TEXT first_name  "NULL"  
		TEXT family_name_kana  "NULL"  
		TEXT first_name_kana  "NULL"  
		TEXT email  "NULL"  
		BOOLEAN is_active  "NOT NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	m_user_daily_defaults {
		BIGINT id PK "NOT NULL"  
		BIGINT user_id FK "NOT NULL"  
		SMALLINT sleep_quality_default  "NOT NULL [0-10]"  
		SMALLINT wake_level_default  "NOT NULL [0-10]"  
		SMALLINT daytime_level_default  "NOT NULL [0-10]"  
		SMALLINT pre_sleep_level_default  "NOT NULL [0-10]"  
		SMALLINT med_adherence_level_default  "NOT NULL [0-10]"  
		SMALLINT appetite_level_default  "NOT NULL [0-10]"  
		SMALLINT sleep_desire_level_default  "NOT NULL [0-10]"
		SMALLINT exercise_level_default  "NOT NULL [0-10]"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	m_medications {
		BIGINT id PK "NOT NULL"  
		TEXT name  "NOT NULL"  
		TEXT generic_name  "NULL"  
		TEXT note  "NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	r_user_medications {
		BIGINT id PK "NOT NULL"  
		BIGINT user_id FK "NOT NULL"  
		BIGINT medication_id FK "NOT NULL"  
		TEXT dosage_text  "NULL"  
		NUMERIC dose_amount  "NULL"  
		TEXT dose_unit  "NULL"  
		DATE start_date  "NOT NULL"  
		DATE end_date  "NULL"  
		BOOLEAN is_current  "NOT NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	r_user_ext_accounts {
		BIGINT id PK "NOT NULL"  
		BIGINT user_id FK "NOT NULL"  
		TEXT provider  "NOT NULL"  
		TEXT ext_user_id  "NOT NULL"  
		TEXT access_token_encrypted  "NULL"  
		TEXT refresh_token_encrypted  "NULL"  
		TIMESTAMPTZ token_expires_at  "NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	t_diaries {
		BIGINT id PK "NOT NULL"  
		BIGINT user_id FK "NOT NULL"  
		DATE diary_date  "NOT NULL"  
		TIMESTAMPTZ sleep_start_at  "NULL"  
		TIMESTAMPTZ sleep_end_at  "NULL"  
		TIMESTAMPTZ bath_start_at  "NULL"  
		TIMESTAMPTZ bath_end_at  "NULL"  
		SMALLINT sleep_quality  "NULL [0-10]"  
		SMALLINT wake_level  "NULL [0-10]"  
		SMALLINT daytime_level  "NULL [0-10]"  
		SMALLINT pre_sleep_level  "NULL [0-10]"  
		SMALLINT med_adherence_level  "NULL [0-10]"  
		SMALLINT appetite_level  "NULL [0-10]"  
		SMALLINT sleep_desire_level  "NULL [0-10]"  
		SMALLINT exercise_level  "NULL [0-10]"  
		TEXT note  "NULL"  
		BOOLEAN has_od  "NULL"  
		JSONB od_times  "NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	t_diary_attachments {
		BIGINT id PK "NOT NULL"  
		BIGINT diary_id FK "NOT NULL"  
		TEXT file_path  "NOT NULL"  
		TEXT file_type  "NOT NULL"  
		BIGINT file_size  "NULL"  
		TEXT thumbnail_path  "NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	r_diary_overdoses {
		BIGINT id PK "NOT NULL"  
		BIGINT diary_id FK "NOT NULL"  
		BIGINT overdose_id FK "NOT NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	t_overdoses {
		BIGINT id PK "NOT NULL"  
		BIGINT user_id FK "NOT NULL"  
		TIMESTAMPTZ occurred_at  "NOT NULL"  
		BIGINT medication_id FK "NULL"  
		TEXT medication_name  "NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	t_medication_intakes {
		BIGINT id PK "NOT NULL"  
		BIGINT user_id FK "NOT NULL"  
		BIGINT user_medication_id FK "NOT NULL"  
		DATE intake_date  "NOT NULL"  
		SMALLINT adherence_score  "NULL [0-10]"  
		TEXT note  "NULL"  
		BIGINT source_id  "NULL"  
		TIMESTAMPTZ created_at  "NOT NULL"  
		TIMESTAMPTZ updated_at  "NOT NULL"  
		TIMESTAMPTZ deleted_at  "NULL"  
		UUID created_by  "NOT NULL"  
		UUID updated_by  "NOT NULL"  
		UUID deleted_by  "NULL"  
	}

	m_users||--o{m_user_daily_defaults:"user_id"
	m_users||--o{r_user_medications:"user_id"
	m_users||--o{t_diaries:"user_id"
	m_users||--o{t_overdoses:"user_id"
	m_users||--o{t_medication_intakes:"user_id"
	m_users||--o{r_user_ext_accounts:"user_id"
	m_medications||--o{r_user_medications:"medication_id"
	r_user_medications||--o{t_medication_intakes:"user_medication_id"
	t_diaries||--o{t_diary_attachments:"diary_id"
	t_diaries||--o{r_diary_overdoses:"diary_id"
	t_overdoses||--o{r_diary_overdoses:"overdose_id"

	style m_users stroke:#D50000,fill:#FFFFFF
	style m_user_daily_defaults fill:#FFFFFF,stroke:#D50000
	style m_medications fill:#FFFFFF,stroke:#D50000
	style r_user_medications fill:#FFFFFF,stroke:#AA00FF
	style r_user_ext_accounts fill:#FFFFFF,stroke:#2962FF
	style r_diary_overdoses fill:#FFFFFF,stroke:#AA00FF
	style t_diaries fill:#FFFFFF,stroke:#2962FF
	style t_diary_attachments fill:#FFFFFF,stroke:#2962FF
	style t_overdoses fill:#FFFFFF,stroke:#2962FF
	style t_medication_intakes fill:#FFFFFF

