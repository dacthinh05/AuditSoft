---
date: 2026-09-11
title: Hoàn thành đồng bộ lưới 4x4 KPI Cards và Làm nét bảng Bóc tách EBITDA NĐ 132
tags: [ui, kpi-cards, typography, ebitda, vsa520]
---

# Hoàn thành tối ưu hóa UI: Grid 4x4 KPI Cards & Bảng EBITDA NĐ 132

## Tóm tắt thay đổi
1. **Đồng bộ lưới 4x4 cho hệ thống KPI Cards:**
   - Hàng 1 (Nghị định 132 & Thuế) và Hàng 2 (Chỉ số kiểm toán VSA 520) đều được quy hoạch về chuẩn lưới `repeat(4, minmax(0, 1fr))` với `gap: '12px'`.
   - Các cạnh viền và cột dọc gióng thẳng hàng 100% từ trên xuống dưới, khắc phục hoàn toàn tình trạng lệch 5 thẻ đè lên 4 thẻ gây vênh layout.
   - Thẻ Pareto được gộp súc tích trong Hàng 2: Giá trị chính `Top 1: {x}% DT`, phụ đề `Top 5: {y}% DT` hiển thị trọn vẹn thông tin độ tập trung khách hàng.
2. **Nâng cấp độ rõ nét bảng Bóc Tách Lãi Vay & EBITDA:**
   - Cố định tỷ lệ độ rộng 3 cột: Khoản Mục (42%), Căn Cứ (26%), Số Tiền (32%) với `tableLayout: 'fixed'`.
   - Cột số tiền sử dụng font chuyên dụng tài chính (`fontVariantNumeric: 'tabular-nums'`, `Consolas, monospace`, `fontWeight: 600`), độ tương phản cao, số đậm rõ ràng.
   - Dòng EBITDA Kỳ Này nổi bật (`background: '#eff6ff'`, border `#bfdbfe`, text xanh đậm `#1d4ed8`, font 13.5px bold).
   - Dòng Lãi vay vượt trần B4 có nền xanh lá/đỏ cảnh báo rõ nét, căn phải thẳng hàng tăm tắp với các dòng trên.

## Kiểm thử
- `npm run typecheck`: Passed sạch (0 lỗi).
