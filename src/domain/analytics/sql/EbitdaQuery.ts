import { JOURNAL_ENTRIES_TABLE_NAME } from '../../engine/schema'

export interface EbitdaSqlResult {
  totalInterestExpense: bigint
  totalInterestIncome: bigint
  totalDepreciation: bigint
}

export const SQL_EBITDA_COMPONENTS = `
SELECT
  COALESCE(SUM(CASE WHEN debit_account LIKE '635%' AND (
    lower(description) REGEXP 'lãi\\s+vay|tiền\\s+vay|interest|vay\\s+ngân\\s+hàng' 
    OR credit_account LIKE '111%' OR credit_account LIKE '112%' 
    OR credit_account LIKE '338%' OR credit_account LIKE '341%'
  ) THEN amount ELSE 0 END), 0)::VARCHAR AS total_interest_expense,
  
  COALESCE(SUM(CASE WHEN credit_account LIKE '515%' AND (
    lower(description) REGEXP 'lãi\\s+(tiền\\s+gửi|cho\\s+vay|tài\\s+khoản|tiết\\s+kiệm)'
    OR debit_account LIKE '111%' OR debit_account LIKE '112%' OR debit_account LIKE '128%'
  ) THEN amount ELSE 0 END), 0)::VARCHAR AS total_interest_income,

  COALESCE(SUM(CASE WHEN debit_account LIKE '214%' OR credit_account LIKE '214%' 
    THEN amount ELSE 0 END), 0)::VARCHAR AS total_depreciation
FROM ${JOURNAL_ENTRIES_TABLE_NAME};
`

export function parseEbitdaQueryResult(rows: Record<string, unknown>[]): EbitdaSqlResult {
  const row = rows[0] || {}
  return {
    totalInterestExpense: BigInt(String(row.total_interest_expense || '0')),
    totalInterestIncome: BigInt(String(row.total_interest_income || '0')),
    totalDepreciation: BigInt(String(row.total_depreciation || '0')),
  }
}
