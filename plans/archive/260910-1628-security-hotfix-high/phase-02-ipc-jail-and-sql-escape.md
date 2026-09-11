# Phase 02: Jail IPC Đọc File + Escape SQL (H4, H5)

## 1. Mục Tiêu
Renderer chỉ đọc được file user đã chọn qua dialog (hoặc file đúng định dạng audit); ô Excel chứa quote/chấm phẩy không phá được câu lệnh DuckDB.

## 2. Việc Làm
1. **H4 — `src/main/index.ts` (handlers `inspectWorkbook`, `readWorkbookRows`, `readHtkkFile`, `importTaxXmlFiles`, `pickTaxFiles`):**
   - Thêm `Set<string> sessionPickedPaths` trong main: mọi đường dẫn do `dialog.showOpenDialog` / drag-drop qua `getPathForFile` trả về được đăng ký; handler đọc file từ chối đường dẫn chưa đăng ký (ngoại lệ: file trong thư mục `temp` của app).
   - Allowlist đuôi file tại cùng chỗ: `.xlsx .xlsm .xls .csv .xml .zip` (thường + chữ hoa). Từ chối còn lại với message tiếng Việt rõ ràng.
   - Không đụng `SamplingTab`/`SetupPage` preflight: chúng đọc qua đúng 2 handler này bằng file đã chọn → vẫn pass.
2. **H5 — `src/domain/engine/DuckDbEngine.ts:79`:**
   - Viết `escapeSqlString(v: string): string` dùng chung (quote-double + bao `'...'`), áp cho **mọi** trường chuỗi (`id`, `debitAccount`, `creditAccount`, `amount` qua BigInt→string sau validate `/^-?\d+$/`, `sourceRow` ép số nguyên).
   - `entryDate/docDate`: chỉ cho pattern `^\d{4}-\d{2}-\d{2}$`, còn lại thành `NULL`.
   - Tên bảng/cột từ hằng số đã có (`JOURNAL_ENTRIES_TABLE_NAME`), không nhận từ tham số ngoài.
   - Kiểm tra `InMemoryJsEngine.query` có cùng pattern nối chuỗi không — có thì áp cùng helper (không refactor dispatch substring, ngoài scope).

## 3. Nghiệm Thu
- `readWorkbookRows('C:/Windows/System32/drivers/etc/hosts', ...)` bị từ chối; file vừa chọn qua dialog đọc bình thường.
- Record với `description = "x'); DROP TABLE journal_entries; --"` insert/select tròn vẹn, bảng còn nguyên.
