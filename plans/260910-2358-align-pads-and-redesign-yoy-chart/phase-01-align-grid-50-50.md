---
title: "Phase 1: Căn Chỉnh Lưới 50/50 Cho Section 2 Thẳng Hàng Với Các Hàng Dưới"
description: "Sửa gridTemplateColumns của Section 2 từ 1.25fr 1fr sang 1fr 1fr đồng bộ với Section 3 và Section 4 để các đường viền card thẳng hàng tuyệt đối."
status: completed
priority: P1
effort: "15m"
tags: [analytics, layout, grid, alignment]
---

# Phase 1: Căn Chỉnh Lưới 50/50 Cho Section 2 Thẳng Hàng Với Các Hàng Dưới

## Mục Tiêu
Khắc phục lỗi "pad này bị lệch so với pad dưới" được phản ánh qua Image #1:
Đưa tỷ lệ chia 2 card của hàng KQKD về đúng tỷ lệ 50% - 50% đồng nhất với hàng EBITDA & Bên liên quan bên dưới.

## Thiết Kế Kỹ Thuật
1. Trong `src/renderer/components/Analytics/GlAnalyticsTab.tsx`:
   - Dòng 333 (Section 2):
     ```tsx
     // Thay đổi từ:
     gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)'
     // Sang:
     gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)'
     ```
2. Điều chỉnh nhẹ padding của các cột trong Bảng B02:
   - Header và Data cell: `padding: '6px 8px'` để khi bảng ở độ rộng 50% (~750px trên màn hình 1568px), cả 6 cột (`Mã số`, `Chỉ tiêu`, `Năm nay`, `Năm trước`, `Chênh lệch`, `%`) đều hiển thị rộng rãi, không bị quấn dòng hay che khuất.

## Files Thay Đổi
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`

## Tiêu Chí Nghiệm Thu
- [ ] Section 2, Section 3, Section 4 đều dùng chung tỷ lệ `minmax(0, 1fr) minmax(0, 1fr)`.
- [ ] Đường phân cách giữa 2 card ở Section 2 thẳng tắp với Section 3 bên dưới, không còn bị lệch sang phải.
