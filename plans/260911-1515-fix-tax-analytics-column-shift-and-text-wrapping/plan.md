---
title: "Sửa Lỗi Lệch Cột Footer Mẫu E380 & Chống Xuống Hàng Header Bảng Thuế GTGT/TNCN"
description: "Khắc phục lỗi thiếu ô Xin hoàn [42] ở dòng CỘNG CẢ NĂM làm xô lệch toàn bộ cột sang trái, đồng thời bổ sung white-space: nowrap và nới rộng cột Kỳ kê khai giúp tiêu đề và số liệu không bị ngắt dòng khó chịu."
status: completed
priority: P1
effort: 1h
branch: main
tags: [ui, tax-analytics, e380, e381, bugfix, table-alignment]
created: 2026-09-11
---

# Kế Hoạch Sửa Lỗi: Lệch Cột Footer Mẫu E380 & Chống Xuống Hàng Header

## 1. Vấn Đề Gốc Rễ (Root Cause)
1. **Lệch Cột Dòng CỘNG CẢ NĂM (Mẫu E380 - Bảng B.1):**
   - Header và body row có 14 cột, bao gồm 7 cột thuế: VAT [25], VAT [35], Đ/c Tăng [38], Đ/c Giảm [37], Xin Hoàn [42], Phải Nộp [40], Số Dư [43].
   - Dòng `CỘNG CẢ NĂM` tại dòng 267-293 của `TaxAnalyticsTab.tsx` bị thiếu mất thẻ `<td>` của cột `Xin Hoàn [42]`.
   - Kết quả: Bị thiếu 1 ô, làm cho `Phải nộp [40]`, `Số dư [43]`, `PS Nợ 133*`, `CL Đầu vào`, `PS Có 33311`, `CL Đầu ra`, `Đã nộp` và `Ghi chú` đều bị đẩy lệch sang trái 1 cột.
2. **Chữ Bị Xuống Hàng Khó Chịu:**
   - Các `<th>` không có `whiteSpace: 'nowrap'`, khi các cột có giá trị `-` bị co lại thì tiêu đề bị bẻ gãy từng từ (ví dụ: `VAT` / `Đầu` / `Ra` / `[35]`).
   - Cột `Kỳ Kê Khai` chỉ rộng `110px`, chuỗi `"Tháng 06/2026"` bị bẻ làm 2 dòng (`Tháng` / `06/2026`), kéo giãn chiều cao cả hàng.

## 2. Giải Pháp Triển Khai
1. **Bổ sung ô `totalRefund42` vào dòng CỘNG CẢ NĂM:**
   - Dòng cộng có đủ 14 ô `<td>`, đúng chuẩn thứ tự: `totalAdjustDecrease37` $\rightarrow$ `totalRefund42` $\rightarrow$ `totalTaxPayable40` $\rightarrow$ `closingBalance43` $\rightarrow$ `totalGlInputVat`...
2. **Chống xuống hàng cho toàn bộ Header & Cột:**
   - Thêm `whiteSpace: 'nowrap'` cho các `<th>` và `<td>` của cả Bảng B.1 (E380) và B.2 (E381).
   - Tăng độ rộng cột Kỳ Kê Khai / Kỳ Khai từ `110px` lên `140px`: Hiển thị `"Tháng 06/2026"` trọn vẹn trên 1 dòng duy nhất, badge `"Chính thức"` nằm gọn gàng bên dưới.
3. **Tối ưu hiển thị Ghi chú Kiểm toán:**
   - Hiển thị từng dòng chênh lệch rõ ràng, có ngắt dòng thanh thoát thay vì dồn cục.
