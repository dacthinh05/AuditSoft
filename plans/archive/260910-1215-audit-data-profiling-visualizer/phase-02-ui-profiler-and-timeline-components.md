# Phase 02: Thiết Kế Bộ Component Trực Quan Hóa Dữ Liệu (UI Profiler Components)

## 1. Mục Tiêu
Thiết kế giao diện thanh điều khiển phân tích dữ liệu trực quan (`AuditDataProfilerBar` và `TimelineRiskChart`) phong cách Power Query nhưng tối giản, sang trọng theo tiêu chuẩn phần mềm kiểm toán chuyên nghiệp (không dùng emoji màu mè hay biểu đồ nặng nề).

## 2. Thiết Kế Chi Tiết Component

### Component 1: `AuditDataProfilerBar.tsx`
- **Thanh Chất lượng Cột (Column Quality Bar)**:
  - Hiển thị tỷ lệ trực quan: Xanh lá (Khớp hoàn toàn) vs Đỏ (Có chênh lệch) vs Vàng (Biến động số tiền).
- **Thanh Phân tầng Số tiền (Amount Tiers Pill Bar)**:
  - 4 nút phân tầng: `<50tr`, `50-500tr`, `500tr-2tỷ`, `>2tỷ`.
  - Mỗi tầng hiển thị số lượng dòng và tổng tiền.
  - Hỗ trợ nhấp chuột để kích hoạt bộ lọc (Active state).

### Component 2: `TimelineRiskChart.tsx`
- **Biểu đồ cột SVG siêu nhẹ 12 tháng**:
  - Trục ngang 12 tháng (T1 -> T12). Chiều cao cột tỉ lệ với giá trị giao dịch.
  - Cột có chênh lệch cao sẽ được đánh dấu viền nổi bật.
  - Cột đặc biệt: **31/12 (Khóa sổ Cutoff)** đặt ở cuối biểu đồ với màu cảnh báo rõ ràng.
  - Hover hiển thị tooltip chi tiết số tiền và số dòng.
  - Nhấp vào tháng nào -> Lọc danh sách chứng từ về tháng đó.

### Component 3: CSS Styling (`src/renderer/styles.css`)
- Thiết kế thanh lịch, phối màu xanh navy (`#0f172a`, `#1e293b`, `#2563eb`), nền sáng sạch sẽ `#f8fafc`.
- Hỗ trợ chế độ thu gọn (Collapsible Accordion) để kiểm toán viên có thể đóng lại khi cần tập trung vào bảng số liệu lớn.

## 3. Danh Sách File
- **Tạo mới**: `src/renderer/components/DataProfiler/AuditDataProfilerBar.tsx`
- **Tạo mới**: `src/renderer/components/DataProfiler/TimelineRiskChart.tsx`
- **Chỉnh sửa**: `src/renderer/styles.css`
