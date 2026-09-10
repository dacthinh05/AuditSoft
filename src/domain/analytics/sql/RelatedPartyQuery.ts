import { JOURNAL_ENTRIES_TABLE_NAME } from '../../engine/schema'

export interface RelatedPartySqlRow {
  id: string
  doc_no: string
  entry_date: string | null
  debit_account: string
  credit_account: string
  amount: string
  partner_code: string
  partner_name: string
  description: string
}

export function buildRelatedPartySql(threshold = 100_000_000n): string {
  return `
SELECT
  id,
  doc_no,
  entry_date,
  debit_account,
  credit_account,
  amount::VARCHAR AS amount,
  partner_code,
  partner_name,
  description
FROM ${JOURNAL_ENTRIES_TABLE_NAME}
WHERE (debit_account LIKE '128%' OR credit_account LIKE '341%' OR credit_account LIKE '3388%' OR debit_account LIKE '141%')
  AND amount >= ${threshold.toString()}
ORDER BY amount DESC;
`
}
