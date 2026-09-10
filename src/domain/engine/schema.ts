export const JOURNAL_ENTRIES_TABLE_NAME = 'journal_entries'

export const DUCKDB_JOURNAL_SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS ${JOURNAL_ENTRIES_TABLE_NAME} (
  id VARCHAR PRIMARY KEY,
  entry_date VARCHAR,
  doc_no VARCHAR,
  doc_date VARCHAR,
  description VARCHAR,
  debit_account VARCHAR,
  credit_account VARCHAR,
  amount BIGINT,
  partner_code VARCHAR,
  partner_name VARCHAR,
  source_row INTEGER
);

CREATE INDEX IF NOT EXISTS idx_journal_debit ON ${JOURNAL_ENTRIES_TABLE_NAME} (debit_account);
CREATE INDEX IF NOT EXISTS idx_journal_credit ON ${JOURNAL_ENTRIES_TABLE_NAME} (credit_account);
CREATE INDEX IF NOT EXISTS idx_journal_partner ON ${JOURNAL_ENTRIES_TABLE_NAME} (partner_code);
CREATE INDEX IF NOT EXISTS idx_journal_amount ON ${JOURNAL_ENTRIES_TABLE_NAME} (amount);
`

export const DUCKDB_BULK_INSERT_SQL = `
INSERT INTO ${JOURNAL_ENTRIES_TABLE_NAME} (
  id, entry_date, doc_no, doc_date, description,
  debit_account, credit_account, amount, partner_code, partner_name, source_row
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`
