# Kế hoạch Triển khai Tính năng Xuất Excel Báo Cáo Phân Tích & Rủi Ro Khóa Sổ (Data Profiler & Cutoff)

## Bối cảnh & Mục tiêu
Hiện tại hệ thống đã có tính năng phân tích dữ liệu trực quan (Data Profiler) gồm phân tầng rủi ro giá trị, phân bổ dòng tiền 12 tháng và nhận diện rủi ro Cutoff 31/12, nhưng kiểm toán viên chưa có cách xuất các kết quả phân tích này ra Excel để lưu hồ sơ kiểm toán.

Mục tiêu:
1. Thêm nút xuất nhanh **`[📊 Xuất Excel Phân Tích]`** trực tiếp trên thanh Data Profiler (kèm xuất danh sách chứng từ theo bộ lọc đang chọn).
2. Tích hợp thêm Sheet **`Phan tich & Rui ro Cutoff`** vào workbook xuất tổng hợp (nâng từ 8 sheet lên 9 sheet chuyên nghiệp).

## Danh sách Phases

1. **Phase 01: Xây dựng hàm Export Workbook cho Data Profiler & Cutoff**
   - File: `src/infrastructure/excel/exportDataProfiler.ts`
   - Tạo workbook gồm 2 phần/sheet:
     - Bảng Phân Tầng Rủi Ro Theo Giá Trị (4 tiers: số dòng, %, tổng tiền VND).
     - Bảng Phân Bổ Dòng Tiền 12 Tháng (T01 - T12: số dòng, tổng tiền, chênh lệch).
     - Bảng Rủi Ro Khóa Sổ Cutoff 31/12 (Số bút toán, tổng tiền, cảnh báo sai lệch niên độ).
     - Danh sách chi tiết các bút toán tương ứng với bộ lọc hiện thời (hoặc toàn bộ nếu không lọc).
   - Bổ sung sheet `Phan tich & Rui ro Cutoff` vào `buildReportWorkbook` trong `src/infrastructure/excel/exportWorkbook.ts`.

2. **Phase 02: Bổ sung IPC Handler & API Bridge**
   - File: `src/shared/ipc.ts`, `src/preload/index.ts`, `src/main/index.ts`
   - Kênh IPC `exportProfilerReport`: mở Save Dialog cho phép KTV lưu file `BaoCao-PhanTich-RuiRo-Cutoff-YYYYMMDD.xlsx`.

3. **Phase 03: Thêm UI Nút Xuất Excel trên thanh Profiler & Nâng cấp nút 8 sheet $\rightarrow$ 9 sheet**
   - File: `src/renderer/components/DataProfiler/AuditDataProfilerBar.tsx`, `src/renderer/pages/ResultsPage.tsx`, `styles.css`.
   - Bổ sung nút **`[📊 Xuất Excel Phân Tích]`** trong `AuditDataProfilerBar.tsx`.
   - Cập nhật label nút tổng thành **`Xuất Báo Cáo Excel (9 sheet)`** phản ánh đúng sheet mới.

4. **Phase 04: Kiểm thử & Đảm bảo toàn vẹn dữ liệu (Verification)**
   - Viết test unit kiểm tra nội dung và cấu trúc workbook sinh ra trong `tests/unit/exportDataProfiler.test.ts`.
   - Chạy `npm run typecheck` và `npm test` toàn hệ thống.
