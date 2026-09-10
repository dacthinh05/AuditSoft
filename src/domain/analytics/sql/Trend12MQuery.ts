import { JOURNAL_ENTRIES_TABLE_NAME } from '../../engine/schema'

export interface Trend12MSqlRow {
  month: number
  account_group: string
  total_amount: string
}

export const SQL_12M_TREND = `
SELECT
  CAST(SUBSTRING(entry_date, 6, 2) AS INTEGER) AS month,
  SUBSTRING(debit_account, 1, 3) AS account_group,
  SUM(amount)::VARCHAR AS total_amount
FROM ${JOURNAL_ENTRIES_TABLE_NAME}
WHERE entry_date IS NOT NULL
  AND SUBSTRING(debit_account, 1, 3) IN ('632', '641', '642', '635', '811')
GROUP BY 1, 2
ORDER BY 1, 2;
`
