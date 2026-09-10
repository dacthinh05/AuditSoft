import { JOURNAL_ENTRIES_TABLE_NAME } from '../../engine/schema'

export interface ParetoSqlRow {
  partner_code: string
  partner_name: string
  total_amount: string
  share_pct: number
  cumulative_pct: number
  is_top_80: boolean
}

export function buildSalesParetoSql(limit = 50): string {
  return `
WITH PartnerTotals AS (
  SELECT
    partner_code,
    MAX(partner_name) AS partner_name,
    SUM(amount) AS total_amount
  FROM ${JOURNAL_ENTRIES_TABLE_NAME}
  WHERE credit_account LIKE '511%'
  GROUP BY partner_code
),
RankedPartners AS (
  SELECT
    partner_code,
    partner_name,
    total_amount,
    SUM(total_amount) OVER () AS grand_total,
    SUM(total_amount) OVER (ORDER BY total_amount DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
  FROM PartnerTotals
)
SELECT
  partner_code,
  partner_name,
  total_amount::VARCHAR AS total_amount,
  ROUND((total_amount * 100.0 / NULLIF(grand_total, 0)), 2) AS share_pct,
  ROUND((running_total * 100.0 / NULLIF(grand_total, 0)), 2) AS cumulative_pct,
  CASE WHEN (running_total * 100.0 / NULLIF(grand_total, 0)) <= 80.0 THEN true ELSE false END AS is_top_80
FROM RankedPartners
ORDER BY total_amount DESC
LIMIT ${limit};
`
}

export function buildVendorParetoSql(limit = 50): string {
  return `
WITH VendorTotals AS (
  SELECT
    partner_code,
    MAX(partner_name) AS partner_name,
    SUM(amount) AS total_amount
  FROM ${JOURNAL_ENTRIES_TABLE_NAME}
  WHERE (debit_account LIKE '15%' OR debit_account LIKE '6%') AND credit_account LIKE '331%'
  GROUP BY partner_code
),
RankedVendors AS (
  SELECT
    partner_code,
    partner_name,
    total_amount,
    SUM(total_amount) OVER () AS grand_total,
    SUM(total_amount) OVER (ORDER BY total_amount DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
  FROM VendorTotals
)
SELECT
  partner_code,
  partner_name,
  total_amount::VARCHAR AS total_amount,
  ROUND((total_amount * 100.0 / NULLIF(grand_total, 0)), 2) AS share_pct,
  ROUND((running_total * 100.0 / NULLIF(grand_total, 0)), 2) AS cumulative_pct,
  CASE WHEN (running_total * 100.0 / NULLIF(grand_total, 0)) <= 80.0 THEN true ELSE false END AS is_top_80
FROM RankedVendors
ORDER BY total_amount DESC
LIMIT ${limit};
`
}
