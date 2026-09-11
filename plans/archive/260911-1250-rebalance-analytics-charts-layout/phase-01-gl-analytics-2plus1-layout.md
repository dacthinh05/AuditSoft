# Phase 1: Tái Cấu Trúc Bố Cục Grid Section 6 Sang Mô Hình 2 Hàng (2 Cột + 1 Full-Width)

## 1. Mục Tiêu
Thay thế lưới 3 cột `repeat(auto-fit, minmax(360px, 1fr))` trong `GlAnalyticsTab.tsx` thành cấu trúc 2 hàng:
- **Hàng 1:** Lưới 2 cột (`gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))'`) chứa `RevenueCogsComboChart` và `CogsStructureStackedChart`. Cả 2 card được bọc trong container có `height: 100%` và `display: flex; flex-direction: column`.
- **Hàng 2:** Card Full-Width chứa `OpexRatioAreaChart`.

## 2. File Chỉnh Sửa
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`

## 3. Các Bước Thực Hiện
1. Tìm Section 6 (dòng 774-793).
2. Thay đổi wrapper container thành `flex flex-col` với `gap: 16px`.
3. Nhóm `RevenueCogsComboChart` và `CogsStructureStackedChart` vào grid 2 cột `gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))'`.
4. Đặt `OpexRatioAreaChart` ra khối riêng biệt 100% full-width ở phía dưới.

## 4. Tiêu Chí Kiểm Tra
- Khi co giãn màn hình, hàng 1 chia đều 2 cột 50%/50% trên màn hình desktop (> 1100px) và tự động xếp chồng trên màn hình nhỏ (< 1000px).
- Hàng 2 chiếm 100% bề ngang, liền mạch với ma trận ở các section tiếp theo.
