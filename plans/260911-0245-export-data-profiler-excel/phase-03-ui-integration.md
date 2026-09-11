# Phase 03: Thêm UI Nút Xuất Excel trên thanh Profiler & Nâng cấp nút tổng 9 sheet

## Mục tiêu
Tạo nút bấm xuất Excel tiện lợi ngay trên thanh Data Profiler và cập nhật nhãn nút báo cáo tổng.

## File tác động
- `src/renderer/components/DataProfiler/AuditDataProfilerBar.tsx`
- `src/renderer/pages/ResultsPage.tsx`
- `src/renderer/styles.css`

## Chi tiết thực hiện
1. `AuditDataProfilerBar.tsx`:
   - Bổ sung prop `onExportProfiler?: () => void`.
   - Đặt nút `[📊 Xuất Excel Phân Tích]` ở góc phải thanh tiêu đề Profiler.
   - Thể hiện trạng thái đang xuất (disabled / loading nếu cần).
2. `ResultsPage.tsx`:
   - Truyền hàm xử lý `handleExportProfiler` vào `AuditDataProfilerBar`:
     - Lấy `profileSummary`, danh sách dòng đã lọc theo tháng/tier hiện hành, và chuỗi mô tả bộ lọc (vd: "Khóa sổ 31/12", "Tháng 12", "Trọng yếu > 2 tỷ").
     - Gọi `window.auditsoft.exportProfilerReport(...)`.
   - Cập nhật text nút chính: `Xuất Báo Cáo Excel (9 sheet)`.
3. `styles.css`:
   - Style nút `.btn-export-profiler`: tông màu xanh ngọc / xanh lá kiểm toán, có icon bảng tính, bo góc tinh tế.

## Tiêu chí nghiệm thu
- KTV nhìn thấy ngay nút xuất Excel phân tích trên thanh Profiler.
- Nhấp nút mở hộp thoại lưu file và xuất đúng file Excel.
