---
title: "Phase 1: Embedded OLAP Engine Foundation (DuckDB In-Process & Fallback Architecture)"
description: "Thiết kế tầng trừu tượng IAuditDataEngine, tích hợp DuckDB in-process engine, định nghĩa schema bảng kế toán chuẩn và cơ chế bulk-insert nạp dữ liệu siêu tốc kèm In-Memory Fallback tự động."
status: completed
priority: P1
effort: "1.0d"
created: 2026-09-10
---

# Phase 1: Embedded OLAP Engine Foundation

## 1. Mục Tiêu (Objective)

Xây dựng nền tảng động cơ dữ liệu phân tích nhúng (Embedded OLAP Data Engine) cho AuditSoft:
- Định nghĩa giao diện trừu tượng `IAuditDataEngine` thống nhất cho mọi thao tác dữ liệu.
- Cài đặt `DuckDbEngine` (chạy in-process trên DuckDB in-memory `':memory:'` hoặc file tạm) với khả năng nạp 100.000 dòng dữ liệu chỉ trong < 500ms.
- Cài đặt `InMemoryJsEngine` đóng vai trò Fallback an toàn (Defensive Fallback), đảm bảo ứng dụng không bao giờ bị gián đoạn ngay cả khi máy tính của kiểm toán viên thiếu thư viện C++ runtime của hệ điều hành.
- Xây dựng cơ chế nạp hàng loạt (Bulk Ingestion) theo khối (chunks) từ Excel reader stream trực tiếp vào bảng CSDL.

---

## 2. Thiết Kế Kỹ Thuật (Technical Specifications)

### 2.1. Tầng Trừu Tượng `IAuditDataEngine`

Vị trí: `src/domain/engine/IAuditDataEngine.ts`

```typescript
export interface JournalEntryRecord {
  id: string
  date: string             // YYYY-MM-DD
  docNo: string            // Số chứng từ
  docDate: string          // Ngày chứng từ
  description: string      // Diễn giải nghiệp vụ
  debitAccount: string     // TK Nợ (e.g. '6351', '1121')
  creditAccount: string    // TK Có (e.g. '1111', '331')
  amount: bigint           // Số tiền phát sinh (BigInt nguyên tệ VNĐ)
  partnerCode: string      // Mã đối tượng / MST
  partnerName: string      // Tên đối tượng / Khách hàng / NCC
  sourceRow: number        // Dòng gốc trong file Excel/CSDL
}

export interface IAuditDataEngine {
  readonly engineType: 'duckdb' | 'sqlite' | 'in_memory_js'
  
  initialize(): Promise<void>
  destroy(): Promise<void>
  
  // Nạp dữ liệu hàng loạt
  bulkInsertJournal(entries: JournalEntryRecord[], onProgress?: (processed: number, total: number) => void): Promise<number>
  
  // Truy vấn trực tiếp
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
  
  // Thống kê nhanh
  getRowCount(): Promise<number>
  getTotalAmount(): Promise<bigint>
}
```

### 2.2. Cấu Trúc Schema Bảng Kế Toán (DuckDB DDL)

Vị trí: `src/domain/engine/schema.ts`

```sql
CREATE TABLE IF NOT EXISTS journal_entries (
  id VARCHAR PRIMARY KEY,
  entry_date DATE,
  doc_no VARCHAR,
  doc_date DATE,
  description VARCHAR,
  debit_account VARCHAR,
  credit_account VARCHAR,
  amount BIGINT,
  partner_code VARCHAR,
  partner_name VARCHAR,
  source_row INTEGER
);

-- Chỉ mục tối ưu hóa tốc độ truy vấn đối chiếu và nhóm tài khoản
CREATE INDEX IF NOT EXISTS idx_journal_debit ON journal_entries (debit_account);
CREATE INDEX IF NOT EXISTS idx_journal_credit ON journal_entries (credit_account);
CREATE INDEX IF NOT EXISTS idx_journal_partner ON journal_entries (partner_code);
CREATE INDEX IF NOT EXISTS idx_journal_amount ON journal_entries (amount);
```

### 2.3. Lớp Quản Lý Tự Động `AuditDataEngineManager`

Vị trí: `src/domain/engine/AuditDataEngineManager.ts`

- Cơ chế khởi tạo:
  1. Thử nạp `DuckDbEngine` (sử dụng `@duckdb/node-api` hoặc `@duckdb/duckdb-wasm`).
  2. Nếu xảy ra ngoại lệ (native module failed / unsupported platform), ghi log cảnh báo và tự động chuyển sang khởi tạo `InMemoryJsEngine`.
  3. Cung cấp cờ `isAccelerated: boolean` để giao diện hiển thị badge *"Tăng tốc DuckDB OLAP: Đang bật"* hoặc *"Chế độ Chuẩn (JS Engine)"*.

---

## 3. Các Bước Thực Hiện Chi Tiết (Implementation Steps)

1. **Bước 1.1**: Cài đặt dependency hoặc thiết lập module DuckDB. Kiểm tra tính tương thích với Electron 33 và Node 20.
2. **Bước 1.2**: Tạo thư mục `src/domain/engine/` và các file:
   - `src/domain/engine/IAuditDataEngine.ts`
   - `src/domain/engine/schema.ts`
   - `src/domain/engine/DuckDbEngine.ts`
   - `src/domain/engine/InMemoryJsEngine.ts`
   - `src/domain/engine/AuditDataEngineManager.ts`
3. **Bước 1.3**: Tích hợp bulk ingestion vào luồng đọc Excel (`readWorkbook.ts` & `reconcile.worker.ts`):
   - Thay vì nạp toàn bộ vào mảng JS, stream dữ liệu theo chunks 10.000 dòng để insert vào engine.
4. **Bước 1.4**: Viết bộ unit tests:
   - `tests/audit-data-engine-foundation.test.ts` kiểm tra: Khởi tạo, Insert 10.000 dòng, Query aggregation, Kiểm tra fallback khi native bị vô hiệu hóa.

---

## 4. Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria)
- [x] `IAuditDataEngine` định nghĩa chuẩn xác với kiểu `BigInt` cho số tiền.
- [x] `DuckDbEngine` tích hợp dynamic loader, sẵn sàng kết nối in-process DuckDB.
- [x] `InMemoryJsEngine` đóng vai trò Fallback an toàn 100%, bảo đảm không crash runtime.
- [x] Cơ chế Fallback sang `InMemoryJsEngine` hoạt động mượt mà khi môi trường thiếu native binary.
- [x] Toàn bộ unit tests tại `tests/audit-data-engine-foundation.test.ts` pass 100% (4/4 tests).
- [x] Toàn bộ test suite dự án 43 test files (234 tests), typecheck và lint đạt 100% pass.
