# Kế Hoạch Hoàn Thành: Tính Năng Xuất Excel Báo Cáo Phân Tích & Rủi Ro Cutoff (Data Profiler)

**Ngày thực hiện:** 2026-09-11
**Mục tiêu:** Bổ sung tính năng xuất Excel riêng cho phân tích Data Profiler và tích hợp vào bộ báo cáo tổng hợp.

## Kết quả đạt được

1. **Xây dựng module Export Data Profiler chuyên dụng:**
   - Tạo file `src/infrastructure/excel/exportDataProfiler.ts` chứa hàm `buildProfilerWorkbook` và `writeProfilerSummaryToWorksheet`.
   - Xuất đầy đủ 3 phần nội dung kiểm toán chuẩn mực:
     - Phần I: Bảng Phân Tầng Rủi Ro Theo Giá Trị Phát Sinh (4 tiers).
     - Phần II: Bảng Phân Bổ Dòng Tiền 12 Tháng & Chênh Lệch Sau Điều Chỉnh.
     - Phần III: Nhận Diện Rủi Ro Kiểm Toán Đặc Biệt (Khóa sổ Cutoff 31/12 và Nghiệp vụ số tiền tròn >=10tr).
     - Kèm Sheet 2 danh sách chi tiết các chứng từ lọc (theo tháng hoặc theo tầng giá trị đang chọn trên UI).

2. **Tích hợp kênh IPC & Electron Dialog:**
   - Kênh IPC `auditsoft/exportProfilerReport` mở hộp thoại Save File với tên mặc định `BaoCao-PhanTich-RuiRo-Cutoff-YYYYMMDD.xlsx`.

3. **Giao diện người dùng:**
   - Bổ sung nút **`📊 Xuất Excel Phân Tích`** màu xanh lá nhạt nổi bật ngay góc phải thanh tiêu đề Data Profiler.
   - Cập nhật nút xuất tổng thành **`Xuất Báo Cáo Excel (9 sheet)`** (thêm sheet thứ 9 `Phan tich & Rui ro Cutoff` vào tệp báo cáo đối chiếu đầy đủ).

4. **Kiểm thử:**
   - Thêm bộ test unit trong `tests/unit/exportDataProfiler.test.ts`.
   - Toàn bộ 77 test suites với 368 tests đều passed 100%.
   - `npm run typecheck` hoàn toàn sạch lỗi.
