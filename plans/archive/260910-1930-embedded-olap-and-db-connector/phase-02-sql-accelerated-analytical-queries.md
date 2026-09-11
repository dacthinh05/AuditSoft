---
title: "Phase 2: SQL-Accelerated Analytical Queries (VSA 520 & VSA 530)"
description: "Chuyển đổi toàn bộ các thuật toán phân tích kiểm toán (EBITDA khống chế lãi vay NĐ 132, Pareto 80/20, Ma trận 12 tháng, Quét bên liên quan VSA 550, Bốc mẫu MUS VSA 530) từ mảng JavaScript sang câu truy vấn SQL Analytical siêu tốc."
status: completed
priority: P1
effort: "1.0d"
created: 2026-09-10
---

# Phase 2: SQL-Accelerated Analytical Queries

## 1. Mục Tiêu (Objective)

Tận dụng sức mạnh xử lý dữ liệu dạng cột (Columnar Engine) của DuckDB để thay thế các vòng lặp `for...of`, `Array.filter()`, `Array.reduce()` trong JavaScript bằng các câu truy vấn SQL Analytical có hỗ trợ **Window Functions**:
- Giảm thời gian tính toán EBITDA và phân tích rủi ro từ **1.500ms xuống < 30ms** trên tập dữ liệu 200.000 dòng.
- Xử lý mượt mà bài toán phân tích tỷ trọng Pareto 80/20 của hàng chục nghìn khách hàng / nhà cung cấp bằng hàm tính tổng lũy kế `SUM() OVER ()`.
- Cung cấp lớp dịch vụ `SqlAnalyticsService` thực thi thống nhất trên cả DuckDB lẫn In-Memory JS Engine.

---

## 2. Chi Tiết Các Truy Vấn SQL Nghiệp Vụ Kiểm Toán

### 2.1. Truy Vấn EBITDA & Chi Phí Lãi Vay (Nghị định 132/2020/NĐ-CP)

```sql
-- Tính tổng chi phí lãi vay (TK 635) và doanh thu lãi tiền gửi/cho vay (TK 515)
SELECT
  COALESCE(SUM(CASE WHEN debit_account LIKE '635%' AND (
    lower(description) REGEXP 'lãi\s+vay|tiền\s+vay|interest|vay\s+ngân\s+hàng' 
    OR credit_account LIKE '111%' OR credit_account LIKE '112%' 
    OR credit_account LIKE '338%' OR credit_account LIKE '341%'
  ) THEN amount ELSE 0 END), 0) AS total_interest_expense,
  
  COALESCE(SUM(CASE WHEN credit_account LIKE '515%' AND (
    lower(description) REGEXP 'lãi\s+(tiền\s+gửi|cho\s+vay|tài\s+khoản|tiết\s+kiệm)'
    OR debit_account LIKE '111%' OR debit_account LIKE '112%' OR debit_account LIKE '128%'
  ) THEN amount ELSE 0 END), 0) AS total_interest_income,

  COALESCE(SUM(CASE WHEN debit_account LIKE '214%' OR credit_account LIKE '214%' 
    THEN amount ELSE 0 END), 0) AS total_depreciation
FROM journal_entries;
```

### 2.2. Phân Tích Tỷ Trọng Pareto Khách Hàng & Nhà Cung Cấp (80/20)

Sử dụng SQL Window Function để tính tổng tiền theo từng đối tượng, sắp xếp giảm dần và tính % lũy kế tức thời:

```sql
WITH PartnerTotals AS (
  SELECT
    partner_code,
    MAX(partner_name) AS partner_name,
    SUM(amount) AS total_amount
  FROM journal_entries
  WHERE credit_account LIKE '511%' -- Đối với doanh thu bán hàng
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
  total_amount,
  ROUND((total_amount * 100.0 / grand_total), 2) AS share_pct,
  ROUND((running_total * 100.0 / grand_total), 2) AS cumulative_pct,
  CASE WHEN (running_total * 100.0 / grand_total) <= 80.0 THEN true ELSE false END AS is_top_80
FROM RankedPartners
ORDER BY total_amount DESC
LIMIT 50;
```

### 2.3. Ma Trận Biến Động Doanh Thu & Chi Phí 12 Tháng (MoM)

```sql
SELECT
  EXTRACT(MONTH FROM entry_date) AS month,
  SUBSTRING(debit_account, 1, 3) AS account_group,
  SUM(amount) AS total_amount
FROM journal_entries
WHERE SUBSTRING(debit_account, 1, 3) IN ('632', '641', '642', '635', '811')
GROUP BY 1, 2
ORDER BY 1, 2;
```

### 2.4. Quét Giao Dịch Nghi Ngờ Bên Liên Quan (VSA 550)

```sql
-- Tìm các khoản cho vay (TK 128) hoặc vay nợ (TK 341, 3388) có số dư lớn nhưng không phát sinh lãi đối ứng
SELECT
  doc_no,
  entry_date,
  debit_account,
  credit_account,
  amount,
  partner_code,
  partner_name,
  description
FROM journal_entries
WHERE (debit_account LIKE '128%' OR credit_account LIKE '341%' OR credit_account LIKE '3388%')
  AND amount >= 100000000 -- >= 100 triệu VNĐ
ORDER BY amount DESC;
```

---

## 3. Các Bước Thực Hiện Chi Tiết (Implementation Steps)

1. **Bước 2.1**: Tạo file `src/domain/analytics/sql/`:
   - `src/domain/analytics/sql/EbitdaQuery.ts`
   - `src/domain/analytics/sql/ParetoQuery.ts`
   - `src/domain/analytics/sql/Trend12MQuery.ts`
   - `src/domain/analytics/sql/RelatedPartyQuery.ts`
   - `src/domain/analytics/sql/SamplingQuery.ts`
2. **Bước 2.2**: Cập nhật các Engine phân tích hiện có (`EbitdaCalculator`, `ConcentrationAnalyzer`, `Trend12MAnalyzer`, `RelatedPartyScanner`) để ưu tiên gọi `IAuditDataEngine.query()` khi engine hỗ trợ SQL.
3. **Bước 2.3**: Viết bộ so sánh đối chiếu tự động (Dual-Run Verifier) để kiểm tra kết quả giữa SQL Engine và Legacy JS Engine trên cùng một bộ dữ liệu thử nghiệm, đảm bảo kết quả trùng khớp chính xác 100% đến từng đồng VNĐ.
4. **Bước 2.4**: Benchmark hiệu năng: đo thời gian chạy trên các kích thước dữ liệu 50k, 100k, 250k, 500k dòng.

---

## 4. Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria)

- [x] Kết quả tính toán EBITDA, Pareto, 12M Trend từ SQL Engine trùng khớp 100% với kết quả của JS Engine hiện tại.
- [x] Thời gian thực thi toàn bộ gói phân tích VSA 520 trên 200.000 dòng giảm từ > 1.200ms xuống < 50ms.
- [x] Không phát sinh lỗi memory leak khi thực hiện nhiều lần phân tích liên tiếp.
- [x] Unit tests pass 100% (3/3 tests trong tests/engine-dual-run-equivalence.test.ts).
