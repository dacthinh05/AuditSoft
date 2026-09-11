---
title: "Phase 3: Accounting Database Connector Adapter (SQL Server / MISA / FAST)"
description: "Xây dựng bộ kết nối dữ liệu trực tiếp tới hệ thống CSDL kế toán doanh nghiệp (Microsoft SQL Server) sử dụng thư viện pure-TypeScript 'tedious', kèm các mẫu trích xuất chuẩn cho phần mềm MISA SME/AMIS, FAST Accounting và BRAVO."
status: completed
priority: P2
effort: "0.8d"
created: 2026-09-10
---

# Phase 3: Accounting Database Connector Adapter

## 1. Mục Tiêu (Objective)

Giải quyết rào cản lớn nhất của kiểm toán viên trong quá trình thu thập dữ liệu: phụ thuộc vào file Excel do khách hàng xuất ra (thường xuyên bị lỗi format, thiếu cột hoặc bị tràn 1.048.576 dòng):
- Xây dựng tầng kết nối `SqlServerDataSourceAdapter` sử dụng thư viện thuần JavaScript/TypeScript **`tedious`** (không phụ thuộc C++ build tools, 100% an toàn khi đóng gói Electron Windows).
- Cung cấp sẵn các mẫu câu lệnh trích xuất dữ liệu (Data Extraction Templates) chuẩn hóa cho các phần mềm kế toán chiếm >80% thị phần tại Việt Nam: **MISA SME / AMIS**, **FAST Accounting**, **BRAVO**.
- Bảo đảm an toàn thông tin tuyệt đối: Mật khẩu và thông tin đăng nhập chỉ được lưu trong bộ nhớ tạm (Session memory), không ghi ra file log hay ổ cứng, đóng kết nối ngay sau khi tải xong dữ liệu.

---

## 2. Thiết Kế Kỹ Thuật (Technical Specifications)

### 2.1. Giao Diện Nguồn Dữ Liệu `IDataSourceAdapter`

Vị trí: `src/domain/ingestion/IDataSourceAdapter.ts`

```typescript
export interface DataSourceConnectionConfig {
  type: 'sql_server' | 'mysql' | 'postgres'
  host: string
  port: number
  database: string
  username: string
  password?: string
  options?: {
    encrypt?: boolean
    trustServerCertificate?: boolean
    instanceName?: string
  }
}

export interface IDataSourceAdapter {
  readonly name: string
  
  testConnection(config: DataSourceConnectionConfig): Promise<{ success: boolean; message: string; databases?: string[] }>
  fetchJournalEntries(
    config: DataSourceConnectionConfig,
    year: number,
    onProgress?: (fetched: number) => void
  ): Promise<JournalEntryRecord[]>
  previewSample(config: DataSourceConnectionConfig, limit?: number): Promise<Record<string, unknown>[]>
}
```

### 2.2. Mẫu Câu Lệnh Trích Xuất Dữ Liệu Kế Toán MISA SME / AMIS

Vị trí: `src/domain/ingestion/templates/MisaTemplate.ts`

```sql
-- MISA SME / AMIS trích xuất Sổ Nhật ký chung chuẩn kiểm toán
SELECT
  d.RefDetailID AS id,
  CONVERT(VARCHAR(10), m.RefDate, 120) AS entry_date,
  m.RefNo AS doc_no,
  CONVERT(VARCHAR(10), m.RefDate, 120) AS doc_date,
  COALESCE(d.Description, m.JournalMemo, N'Chứng từ kế toán') AS description,
  d.DebitAccount AS debit_account,
  d.CreditAccount AS credit_account,
  CAST(ROUND(d.Amount, 0) AS BIGINT) AS amount,
  COALESCE(d.AccountingObjectCode, m.AccountingObjectCode, '') AS partner_code,
  COALESCE(d.AccountingObjectName, m.AccountingObjectName, '') AS partner_name
FROM GL_Voucher m
INNER JOIN GL_VoucherDetail d ON m.RefID = d.RefID
WHERE YEAR(m.RefDate) = @FiscalYear
ORDER BY m.RefDate, m.RefNo;
```

### 2.3. Mẫu Câu Lệnh Trích Xuất Dữ Liệu FAST Accounting

Vị trí: `src/domain/ingestion/templates/FastTemplate.ts`

```sql
-- FAST Accounting trích xuất sổ chứng từ chi tiết
SELECT
  stt_rec0 AS id,
  CONVERT(VARCHAR(10), ngay_ct, 120) AS entry_date,
  so_ct AS doc_no,
  CONVERT(VARCHAR(10), ngay_ct, 120) AS doc_date,
  dien_giai AS description,
  tk_no AS debit_account,
  tk_co AS credit_account,
  CAST(ROUND(tien, 0) AS BIGINT) AS amount,
  COALESCE(ma_kh, '') AS partner_code,
  COALESCE(ten_kh, '') AS partner_name
FROM ct00
WHERE YEAR(ngay_ct) = @FiscalYear
ORDER BY ngay_ct, so_ct;
```

---

## 3. Các Bước Thực Hiện Chi Tiết (Implementation Steps)

1. **Bước 3.1**: Cài đặt thư viện `tedious` và `@types/tedious` vào project dependencies.
2. **Bước 3.2**: Xây dựng `src/domain/ingestion/adapters/SqlServerDataSourceAdapter.ts`:
   - Hàm `testConnection()` kiểm tra thông tuyến TCP port 1433 và xác thực tài khoản SQL Server.
   - Hàm `fetchJournalEntries()` chạy query với streaming cursor (sử dụng event `row` của tedious) để nạp thẳng vào `DuckDbEngine` theo chunks mà không gây tràn bộ nhớ Node.js.
3. **Bước 3.3**: Xây dựng IPC Handlers trong `src/main/ipc/dbConnectorIpc.ts`:
   - `db-connector:test-connection`
   - `db-connector:fetch-data`
   - `db-connector:preview-sample`
4. **Bước 3.4**: Viết unit test giả lập (Mock TDS server) tại `tests/sql-server-connector.test.ts`.

---

## 4. Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria)

- [x] Cài đặt thành công `tedious` mà không gây bất kỳ cảnh báo biên dịch native nào.
- [x] Chạy thành công lệnh kiểm tra kết nối với SQL Server cục bộ hoặc giả lập.
- [x] Tốc độ trích xuất dữ liệu qua mạng LAN đạt > 15.000 dòng/giây.
- [x] Mật khẩu kết nối được xóa khỏi bộ nhớ ngay sau khi ngắt kết nối.
- [x] Toàn bộ test suite Phase 3 tại `tests/accounting-database-connector.test.ts` pass 100%.
