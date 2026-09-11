# Phase 2: Chuẩn Hóa Chú Thích Ký Hiệu Kiểm Toán (Tickmarks Legend)

## Mục Tiêu
- Bổ sung helper `fillTickmarksLegend(editor, sheetName, startRow)` trong `src/domain/workingpaper/helpers.ts`.
- Ghi nhận 4 ký hiệu chuẩn mực VACPA vào chân các bảng chọn mẫu:
  + `^`: Đã kiểm tra số cộng số học (Footing/Cross-footing).
  + `✓`: Đã kiểm tra đối chiếu với chứng từ gốc hợp lệ (Vouching).
  + `GL`: Đã khớp đúng với Sổ Cái (Agreed to General Ledger).
  + `TB`: Đã khớp đúng Bảng CĐPS (Agreed to Trial Balance).
- Tích hợp vào các sheet mẫu kiểm tra chứng từ chi tiết:
  + `D 191.1`, `D 191.2` (Phần hành Tiền)
  + `D 391` (Phải thu)
  + `D 595` (Hàng tồn kho)
  + `E 191` (Vay)
  + `E 291` (Phải trả)
  + `G 191.1` (Doanh thu)
