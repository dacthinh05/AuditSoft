# Plan: Khắc Phục Lỗi Nhận Diện Sai Sheet NKC & Đồng Bộ Triệt Để Lựa Chọn Sheet Giữa Màn Hình Setup và Phân Tích

## 1. Bối Cảnh & Nguyên Nhân Gốc Rễ (Root Cause Analysis)
Người dùng nạp file Excel chứa cả 2 sheet (`NKC_TrcDc` và `NKC_SauDc`). Khi chọn đọc sheet Trước điều chỉnh ở `SetupPage`, sang trang `Phân Tích Sổ NKC (VSA 520)` và các module Thuế (`taxstats`, `taxrisk`), hệ thống vẫn trơ trơ lấy dữ liệu của sheet Sau điều chỉnh:
1. **API `auditAnalyze` không nhận `sheetName`:**
   - Trong `src/shared/schemas.ts`: `auditAnalyzeSchema` chỉ nhận `{ filePath: string }`.
   - Frontend `PreliminaryAnalyticsPage.tsx` và `TaxStatsPage.tsx` chỉ gửi `filePath` xuống main.
   - Dưới backend, `ExcelImportService.ts` tự động chạy thuật toán đoán sheet (`NAME_PRIOR`). Khi cả 2 sheet đều chứa chữ "NKC", backend tự ý chọn sheet đứng trước / điểm cao hơn (ở đây là `NKC_SauDc`), hoàn toàn **vứt bỏ cấu hình sheet mà người dùng đã chọn**!
2. **Bộ nhớ đệm (`glSnapshot`) chỉ so sánh `filePath`:**
   - Trong store `taxStatsSlice.ts`, `glSnapshot` chỉ lưu `{ filePath, journals }` mà không lưu `sheetName`.
   - Khi người dùng đổi sheet từ `NKC_SauDc` sang `NKC_TrcDc`, `filePath` không đổi $\rightarrow$ các `useEffect` tưởng dữ liệu không thay đổi nên không phân tích lại, dùng lại toàn bộ journals của sheet cũ!
3. **Màn hình Phân tích hiển thị thiếu tên sheet:**
   - Header chỉ ghi tên file (ví dụ `Sổ NKC: file.xlsx`), người dùng không biết hệ thống đang đọc sheet nào bên trong file.

## 2. Mục Tiêu (Outcome)
- **Tuyệt đối tôn trọng lựa chọn của người dùng:** Khi người dùng chọn sheet nào (dù là Trước ĐC hay Sau ĐC), backend `auditAnalyze` bắt buộc phải đọc và phân tích đúng 100% sheet đó.
- **Tự động làm mới dữ liệu khi đổi sheet:** Đổi sheet trong file lập tức xóa cache và kích hoạt phân tích lại.
- **Minh bạch hóa trên giao diện:** Hiển thị rõ tên file kèm tên sheet đang đọc trên thanh Header của trang Phân Tích.

## 3. Các Giai Đoạn Triển Khai (Phases)

- [x] **Phase 1: Mở rộng `auditAnalyze` API & Schemas hỗ trợ `sheetName`**
  - Cập nhật `src/shared/schemas.ts`: thêm `sheetName: z.string().optional()` vào `auditAnalyzeSchema` và `auditExportSchema`.
  - Cập nhật `src/shared/types/analytics.ts` và `src/shared/ipc.ts`.
  - Cập nhật `src/main/AnalysisPipeline.ts`: truyền `sheetName` vào `ExcelImportService.importWorkbook(opts.filePath, overrides)`.

- [x] **Phase 2: Đồng bộ `sheetName` vào `glSnapshot` & Store Slice (`taxStatsSlice.ts`)**
  - Mở rộng `GlSnapshot`: `{ filePath: string; sheetName?: string; journals: JournalRowDTO[] }`.
  - Cập nhật các module tiêu thụ (`TaxStatsPage.tsx`, `TaxRiskScannerPage.tsx`): Kiểm tra cả `filePath` và `sheetName` trước khi quyết định dùng cache.

- [x] **Phase 3: Cập nhật `PreliminaryAnalyticsPage.tsx` — Truyền `sheetName` & Hiển thị minh bạch**
  - Truyền `sheetName: activeCfg?.sheetName` vào lời gọi `window.auditsoft.auditAnalyze`.
  - Đưa `activeCfg?.sheetName` vào dependency array của `useEffect` phân tích.
  - Cập nhật Header tag: `Sổ NKC: [TênFile] (Sheet: [TênSheet])`.

- [x] **Phase 4: Kiểm thử, Typecheck & Xác nhận không hồi quy**
  - Viết unit test xác nhận `ExcelImportService` tuân thủ override `sheetName`.
  - Chạy `npx tsc -p tsconfig.web.json --noEmit` & `npx tsc -p tsconfig.node.json --noEmit`.
  - Chạy `npx vitest run`.
