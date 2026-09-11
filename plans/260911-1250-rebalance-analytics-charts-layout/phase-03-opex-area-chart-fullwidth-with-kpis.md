# Phase 3: Tối Ưu Hóa OpexRatioAreaChart Full-Width Kèm Thẻ KPI Tóm Tắt Chi Phí

## 1. Mục Tiêu
Nâng cấp `OpexRatioAreaChart` khi được đặt ở vị trí Full-Width (Hàng 2):
- Không để đồ thị diện tích bị kéo giãn quá dẹt một cách đơn điệu.
- Chia bố cục bên trong Card thành:
  - **72% bên trái:** Đồ thị diện tích Area Chart trải dài 12 tháng (CP Bán hàng 641, CP Quản lý 642, Tổng OPEX/DT).
  - **28% bên phải:** Cột Thẻ Tóm Tắt KPI Hiệu Năng OPEX Cả Năm (Enterprise KPI Cards) gồm:
    1. **Chi phí Bán hàng (641):** Tỷ trọng TB năm + Tổng số tiền.
    2. **Chi phí QLDN (642):** Tỷ trọng TB năm + Tổng số tiền.
    3. **Tổng OPEX / Doanh thu:** Tỷ trọng TB năm + Đánh giá ngưỡng an toàn kiểm toán (Benchmark so với trung bình ngành).

## 2. File Chỉnh Sửa
- `src/renderer/components/Analytics/charts/OpexRatioAreaChart.tsx`

## 3. Các Bước Thực Hiện
1. Nhận dữ liệu `annualTotals` và `annualPcts` từ `report: OpexRatioReport`.
2. Tạo layout flex/grid 2 cột trong nội dung card:
   - Cột đồ thị SVG: Chiếm `flex: 1` hoặc `minmax(0, 72%)`.
   - Cột KPI Dashboard: Chiếm `min-width: 260px` hoặc `28%`, thiết kế 3 thẻ số liệu bo góc tinh tế với viền màu tương ứng chuỗi dữ liệu (hồng/đỏ cho 641, tím/xanh cho 642, slate cho Tổng OPEX).
3. Đảm bảo tính co giãn responsive: Khi màn hình thu nhỏ, cột KPI tự động co giãn hoặc chuyển xuống dưới mượt mà.

## 4. Tiêu Chí Kiểm Tra
- Biểu đồ diện tích hiển thị thanh thoát, đường cong mềm mại, nhãn trục rõ ràng.
- Khối KPI bên phải cung cấp thông tin kiểm toán tức thì mà không cần phải rê chuột từng tháng.
