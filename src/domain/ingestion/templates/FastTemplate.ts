/**
 * Mẫu câu truy vấn chuẩn cho phần mềm kế toán FAST Accounting
 * Bảng dữ liệu: ct00 (Chứng từ chi tiết)
 */
export function buildFastExtractionQuery(year: number, limit?: number): string {
  const topClause = limit ? `TOP ${limit}` : ''
  return `
SELECT ${topClause}
  CONVERT(VARCHAR(36), stt_rec0) AS id,
  CONVERT(VARCHAR(10), ngay_ct, 120) AS entry_date,
  COALESCE(so_ct, '') AS doc_no,
  CONVERT(VARCHAR(10), ngay_ct, 120) AS doc_date,
  COALESCE(dien_giai, N'Chứng từ kế toán FAST') AS description,
  COALESCE(tk_no, '') AS debit_account,
  COALESCE(tk_co, '') AS credit_account,
  CAST(ROUND(COALESCE(tien, 0), 0) AS BIGINT) AS amount,
  COALESCE(ma_kh, '') AS partner_code,
  COALESCE(ten_kh, '') AS partner_name,
  ROW_NUMBER() OVER (ORDER BY ngay_ct, so_ct) AS source_row
FROM ct00
WHERE YEAR(ngay_ct) = ${year}
ORDER BY ngay_ct, so_ct;
`
}
