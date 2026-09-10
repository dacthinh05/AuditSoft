/**
 * Mẫu câu truy vấn chuẩn cho phần mềm kế toán MISA SME / MISA AMIS
 * Bảng dữ liệu: GL_Voucher (Master) và GL_VoucherDetail (Chi tiết dòng hạch toán)
 */
export function buildMisaExtractionQuery(year: number, limit?: number): string {
  const topClause = limit ? `TOP ${limit}` : ''
  return `
SELECT ${topClause}
  CONVERT(VARCHAR(36), d.RefDetailID) AS id,
  CONVERT(VARCHAR(10), m.RefDate, 120) AS entry_date,
  COALESCE(m.RefNo, '') AS doc_no,
  CONVERT(VARCHAR(10), m.RefDate, 120) AS doc_date,
  COALESCE(d.Description, m.JournalMemo, N'Chứng từ kế toán MISA') AS description,
  COALESCE(d.DebitAccount, '') AS debit_account,
  COALESCE(d.CreditAccount, '') AS credit_account,
  CAST(ROUND(COALESCE(d.Amount, 0), 0) AS BIGINT) AS amount,
  COALESCE(d.AccountingObjectCode, m.AccountingObjectCode, '') AS partner_code,
  COALESCE(d.AccountingObjectName, m.AccountingObjectName, '') AS partner_name,
  ROW_NUMBER() OVER (ORDER BY m.RefDate, m.RefNo) AS source_row
FROM GL_Voucher m
INNER JOIN GL_VoucherDetail d ON m.RefID = d.RefID
WHERE YEAR(m.RefDate) = ${year}
ORDER BY m.RefDate, m.RefNo;
`
}
