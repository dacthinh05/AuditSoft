---
date: 2026-09-11
title: Tinh gọn thead Bảng Chi Phí Theo Yếu Tố và Đổi tên cột Tổng Chi Phí
tags: [ui, analytics, table-header, expense-by-nature]
---

# Tinh gọn tiêu đề bảng Chi Phí Theo Yếu Tố

## Thay đổi thực hiện
- File: `src/renderer/components/Analytics/ExpenseByNatureTable.tsx`
- Bỏ hàng tiêu đề gộp cấp 1: `5 YẾU TỐ CHI PHÍ ĐẦU VÀO PHÁT SINH TRONG KỲ`.
- Chuyển `<thead>` thành một hàng duy nhất chứa 7 cột đồng cấp, chiều cao pad ngang bằng nhau giữa `Kỳ Kế Toán`, 5 cột yếu tố chi phí và cột tổng.
- Đổi tên cột `TỔNG YẾU TỐ` thành `TỔNG CHI PHÍ`.

## Kết quả kiểm thử
- `npm run typecheck`: Passed sạch (0 lỗi).
