# Phase 02: Sửa Lỗi Tooltip Tràn Viền & Xử Lý Thang Đo Biểu Đồ

## 1. Mục Tiêu
Khắc phục triệt để lỗi Tooltip bị đè rách / tràn ra khỏi viền màn hình bên phải khi di chuột vào Tháng 12 trong `ChartTooltip.tsx`, đồng thời tinh chỉnh thang đo của `RevenueCogsComboChart.tsx` khi gặp doanh nghiệp có biên lãi gộp âm cực đoan (-1000%).

## 2. Các Thay Đổi Chi Tiết

### 1. `src/renderer/components/Analytics/charts/ChartTooltip.tsx`:
- **Tính toán tọa độ thông minh theo Viewport**:
  ```ts
  const TOOLTIP_WIDTH = 220
  const isNearRightEdge = x + TOOLTIP_WIDTH + 20 > (typeof window !== 'undefined' ? window.innerWidth : 1200)
  const posX = isNearRightEdge ? Math.max(10, x - TOOLTIP_WIDTH - 14) : x + 14
  ```
- **Tối ưu phông chữ và nền**:
  - Đảm bảo màu chữ `#f8fafc` trên nền tối `#0f172a`, viền `#334155` sắc nét, bóng mờ `box-shadow` êm ái.
  - Không bị cắt bớt hoặc đè lên các thành phần giao diện khác (đảm bảo `zIndex: 9999`).

### 2. `src/renderer/components/Analytics/charts/RevenueCogsComboChart.tsx`:
- **Xử lý Biên lãi gộp âm cực đoan**:
  - Khi một tháng có biên lãi gộp tụt xuống dưới -50% (ví dụ: T12 dồn giá vốn âm -1047%):
    - Điểm trên biểu đồ được clamp hiển thị ở mức sàn đáy biểu đồ (`MIN_PCT = -30%`) thay vì vẽ đường thẳng cắm thủng cả khung SVG.
    - Điểm này được gắn chấm cảnh báo màu cam đỏ với vòng tròn radar nhấp nháy tinh tế.
    - Tooltip vẫn hiển thị trung thực con số thực tế: `Biên lãi gộp: -1047.8% (Dồn giá vốn cuối kỳ)`.
  - Giữ cho các cột doanh thu tháng 1–11 không bị đè bẹp hoàn toàn:
    - Khi chênh lệch giữa max và trung bình quá 10 lần, sử dụng thang đo nén thông minh hoặc tách hiển thị cảnh báo riêng.

## 3. Tiêu Chí Nghiệm Thu
- Di chuột vào bất kỳ tháng nào từ T1 đến T12, Tooltip luôn nằm trọn vẹn 100% bên trong màn hình, không bao giờ bị tràn mép hay che khuất.
- Biểu đồ hiển thị hài hòa, không bị gãy nét hay đè bẹp bố cục.
