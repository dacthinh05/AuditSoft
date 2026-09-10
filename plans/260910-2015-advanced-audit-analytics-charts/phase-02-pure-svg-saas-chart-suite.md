---
title: "Phase 2: Pure SVG SaaS Chart Suite (Combo, Stacked Bar, Area, Waterfall)"
description: "Xây dựng trọn bộ 4 component biểu đồ tương tác bằng Pure React SVG (0 KB external dependency, zero network, zero bundle bloat) chuẩn phong cách Enterprise SaaS tối giản, độ tương phản cao và không emoji trang trí."
status: planned
priority: P1
effort: "8h"
created: 2026-09-10
---

# Phase 2: Pure SVG SaaS Chart Suite

## 1. Mục Tiêu
Xây dựng 4 component biểu đồ trực quan hóa dữ liệu kế toán bằng **Pure React SVG**. Không sử dụng bất kỳ thư viện vẽ biểu đồ nặng nào của bên thứ ba (`recharts`, `chart.js`, `d3`), đảm bảo:
- **0 KB Dependency ngoài**: Không làm tăng kích thước tệp đóng gói Electron.
- **Tương thích 100% Offline**: Chạy mượt mà trên mọi máy tính Windows không có kết nối mạng.
- **Chuẩn phong cách Enterprise SaaS**: Thiết kế sắc nét, tối giản, màu sắc tương phản cao, số liệu monospace rõ ràng, hoàn toàn không sử dụng emoji rườm rà.

## 2. Danh Sách Component Cần Xây Dựng

| Component | Vị Trí | Trách Nhiệm |
|-----------|--------|-------------|
| `RevenueCogsComboChart.tsx` | `src/renderer/components/Analytics/charts/` | Biểu đồ kép (Dual-Axis Combo): Cột Doanh thu vs Giá vốn + Đường Biên lãi gộp % và đường cơ sở trung bình. |
| `CogsStructureStackedChart.tsx` | `src/renderer/components/Analytics/charts/` | Biểu đồ cột 100% xếp chồng: Bóc tách cơ cấu giá thành sản xuất (621, 622, 627, 154/156) qua 12 tháng. |
| `OpexRatioAreaChart.tsx` | `src/renderer/components/Analytics/charts/` | Biểu đồ diện tích xếp tầng: Tỷ lệ chi phí bán hàng (641) và quản lý (642) trên mỗi 100đ doanh thu. |
| `ProfitWaterfallChart.tsx` | `src/renderer/components/Analytics/charts/` | Biểu đồ thác nước: Cầu nối dòng chảy từ Doanh thu thuần về Lợi nhuận trước thuế. |
| `ChartTooltip.tsx` | `src/renderer/components/Analytics/charts/` | Popover tooltip nổi hiển thị chi tiết số tiền VNĐ và % khi hover chuột vào các điểm dữ liệu. |

## 3. Đặc Tả Kỹ Thuật Từng Biểu Đồ

### 3.1. `RevenueCogsComboChart.tsx` (Doanh Thu vs Giá Vốn & Biên Lãi Gộp)
- **Kích thước**: `viewBox="0 0 1000 280"`, co giãn `100%` theo chiều ngang container.
- **Trục tung bên trái (Y1)**: Thang đo tiền tệ (VNĐ) tự động co giãn từ 0 đến $\text{Max}(\text{Doanh thu}, \text{Giá vốn})$. Định dạng nhãn trục: Tỷ / Triệu VNĐ.
- **Trục tung bên phải (Y2)**: Thang đo tỷ lệ % Biên lãi gộp (từ $-20\%$ đến $+60\%$).
- **Cột kép**:
  - Cột Doanh thu (511): Màu xanh dương `#0284c7`, bo góc nhẹ `rx="3"`.
  - Cột Giá vốn (632): Màu cam đất `#ea580c`, bo góc nhẹ `rx="3"`.
- **Đường Biên lãi gộp (Line)**:
  - Đường cong Bézier uốn lượn màu xanh ngọc `#059669` (hoặc chuyển đỏ `#dc2626` nếu giá trị âm).
  - Đường tham chiếu cơ sở (Dashed line) màu xám `#94a3b8` thể hiện mức biên lãi gộp trung bình cả năm.
  - Điểm dữ liệu (Circles): Các tháng có cảnh báo lệch $\pm 10\%$ có vòng tròn nhấp nháy (pulse ring) màu hổ phách/đỏ.
- **Series Toggles (Bật/Tắt chuỗi)**: Các nút pill bấm chọn `[✓ Doanh thu 511] [✓ Giá vốn 632] [✓ Biên lãi gộp %]`.

### 3.2. `CogsStructureStackedChart.tsx` (Cấu Trúc Bóc Tách Giá Vốn 100%)
- **Kích thước**: `viewBox="0 0 1000 260"`.
- **12 Cột tháng (T1 đến T12)**: Chiều cao mỗi cột đại diện cho 100% chi phí giá vốn của tháng đó.
- **Phân đoạn xếp tầng (Stacked Segments)**:
  - Phân đoạn 1: Chi phí NVL (621) — Xanh lá `#10b981`.
  - Phân đoạn 2: Chi phí Nhân công (622) — Xanh dương `#3b82f6`.
  - Phân đoạn 3: Chi phí Sản xuất chung (627) — Vàng hổ phách `#f59e0b`.
  - Phân đoạn 4: Chi phí Dở dang / Hàng hóa mua ngoài (154/156) — Tím `#8b5cf6`.
- **Chú giải (Legend)**: Hiển thị rõ tên tài khoản và tổng số tiền của từng yếu tố trong cả năm.

### 3.3. `OpexRatioAreaChart.tsx` (Tỷ Lệ OPEX / Doanh Thu)
- **Kích thước**: `viewBox="0 0 1000 260"`.
- Thể hiện tỷ lệ % chiếm dụng của Chi phí bán hàng (TK 641) và Chi phí QLDN (TK 642) trên mỗi đồng doanh thu theo tháng.
- Hiệu ứng Gradient Area mềm mại với độ mờ `opacity: 0.15`.
- Đường biên nét `stroke-width="2"` sắc sảo.

### 3.4. `ProfitWaterfallChart.tsx` (Cầu Nối Dòng Chảy Lợi Nhuận)
- **Kích thước**: `viewBox="0 0 1000 300"`.
- Các cột lơ lửng (Floating Bars) theo dòng chảy:
  - Cột bắt đầu `Doanh thu thuần`: Cột đầy từ 0, màu xanh dương `#0284c7`.
  - Cột giảm trừ `Giá vốn (632)`: Cột treo lơ lửng, màu đỏ `#ef4444`.
  - Cột tiểu tổng `Lợi nhuận gộp`: Cột đầy từ 0, màu xám xanh `#334155`.
  - Cột tăng `Doanh thu tài chính (515)`: Màu xanh lá `#10b981`.
  - Cột giảm `Chi phí tài chính (635)`: Màu đỏ `#ef4444`.
  - Cột giảm `Chi phí bán hàng (641)` & `Chi phí QLDN (642)`: Màu đỏ `#ef4444`.
  - Cột biến động `Thu nhập khác (711 - 811)`: Xanh lá nếu lãi, đỏ nếu lỗ.
  - Cột kết thúc `Lợi nhuận trước thuế`: Cột đầy từ 0, màu xanh ngọc `#059669`.
- Các đường kẻ đứt nối giữa đỉnh cột trước với đáy cột sau (Connecting Guidelines) tạo cảm giác dòng chảy liên tục.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Cả 4 component biểu đồ render mượt mà, không phụ thuộc bất kỳ script hoặc font bên ngoài nào.
2. Tooltip hoạt động nhạy bén khi rê chuột qua các tháng hoặc các cột, hiển thị số tiền chính xác định dạng phân cách hàng nghìn.
3. Không sử dụng emoji trang trí, font chữ monospace rõ ràng, đường nét sắc sảo.
4. Biểu đồ tự động co giãn theo kích thước khung chứa (Responsive width).
