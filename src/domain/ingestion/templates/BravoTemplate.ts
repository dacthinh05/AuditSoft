/**
 * Mẫu câu truy vấn chuẩn cho phần mềm kế toán BRAVO ERP (BRAVO 7 / 8)
 * Bảng dữ liệu: B30AccDoc (Master) và B30AccDocDetail (Detail)
 */
export function buildBravoExtractionQuery(year: number, limit?: number): string {
  const topClause = limit ? `TOP ${limit}` : ''
  return `
SELECT ${topClause}
  CONVERT(VARCHAR(36), d.Id) AS id,
  CONVERT(VARCHAR(10), m.DocDate, 120) AS entry_date,
  COALESCE(m.DocNo, '') AS doc_no,
  CONVERT(VARCHAR(10), m.DocDate, 120) AS doc_date,
  COALESCE(d.Description, m.Description, N'Chứng từ kế toán BRAVO') AS description,
  COALESCE(d.DebitAcc, '') AS debit_account,
  COALESCE(d.CreditAcc, '') AS credit_account,
  CAST(ROUND(COALESCE(d.OriginalAmount, 0), 0) AS BIGINT) AS amount,
  COALESCE(d.CustomerCode, '') AS partner_code,
  COALESCE(d.CustomerName, '') AS partner_name,
  ROW_NUMBER() OVER (ORDER BY m.DocDate, m.DocNo) AS source_row
FROM B30AccDoc m
INNER JOIN B30AccDocDetail d ON m.Id = d.ParentId
WHERE YEAR(m.DocDate) = ${year}
ORDER BY m.DocDate, m.DocNo;
`
}
